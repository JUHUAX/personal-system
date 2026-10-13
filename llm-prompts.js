(function(root) {
"use strict";
const registry = typeof module !== "undefined" && module.exports ? require("./llm-prompt-registry.js") : root.LlmPromptRegistry;
const examples = typeof module !== "undefined" && module.exports ? require("./llm-prompt-examples.js") : root.LlmPromptExamples;
const contracts = typeof module !== "undefined" && module.exports ? require("./llm-prompt-contracts.js") : root.LlmPromptContracts;
function createPromptComposer({ fragments, modules, definitions, renderExamples }) {
  const definitionByKey = Object.fromEntries(definitions.map(item => [item.key, item]));
  const heading = (title, text) => "【" + title + "】\n" + text;
  function renderFragments(ids, seen) {
    const texts = [];
    for (const id of ids) {
      if (seen.has(id)) continue;
      if (!Object.hasOwn(fragments, id)) throw new Error("未注册的Prompt片段");
      seen.add(id);
      texts.push(fragments[id]);
    }
    return texts.join("\n");
  }
  function renderPrefix(definition, seen) {
    return definition.prefixModules.map(id => {
      const module = modules[id];
      if (!module) throw new Error("未注册的前缀模块");
      const text = renderFragments(module.fragments, seen);
      return text ? heading(module.title, text) : "";
    }).filter(Boolean).join("\n\n");
  }
  function resolveDefinition(action, variant) {
    const key = variant ? action + ":" + variant : action;
    const definition = definitionByKey[key];
    if (!definition) throw new Error("未注册的Action或变体");
    return definition;
  }
  function compileSystem(action, variant) {
    const definition = resolveDefinition(action, variant);
    const seen = new Set();
    const prefix = renderPrefix(definition, seen);
    const taskName = "操作：" + definition.action +
      (definition.variant ? "；变体：" + definition.variant : "") + "。";
    const supplement = renderFragments(definition.suffixFragments || [], seen);
    const output = seen.has(definition.outputContract) ? "" :
      renderFragments([definition.outputContract], seen);
    const examples = renderExamples(definition);
    const suffix = [
      heading("当前任务", taskName + "\n" + definition.task),
      heading("输入绑定", definition.input),
      supplement ? heading("任务补充说明",
        (definition.extraScope ? definition.extraScope + "\n" : "") + supplement) : "",
      heading("任务规则", definition.rules),
      output ? heading("结果字段", output) : "",
      heading("异常处理", definition.errors),
      examples.length ? heading("任务示例", examples.join("\n\n")) : "",
      heading("条件重试", fragments["D.LENGTH_FEEDBACK"])
    ].filter(Boolean).join("\n\n");
    return { definition, prefix, system: prefix + "\n\n" + suffix };
  }
  return { resolveDefinition, compileSystem };
}


function createExampleComposer({
  fixtureTemplates, exampleRecipes, exampleIdsByTask, boundaryText,
  validateExampleInput, validateExampleOutput
}) {
const exampleById = Object.fromEntries(exampleRecipes.map(item => [item.id, item]));

// 下列两个校验函数由V2任务输入契约、O.*、L.*和业务校验器提供。
// validateExampleInput(definition, input)
// validateExampleOutput(definition, input, output)
// 不复用当前尚未支持V2空值和进度字段的旧清洗函数。

const unsafeKeys = new Set(["__proto__", "prototype", "constructor"]);
function requireSafeKey(key) {
  if (typeof key !== "string" || unsafeKeys.has(key)) {
    throw new Error("非法示例字段名");
  }
}
function requireAllowedKeys(object, allowed) {
  if (Object.keys(object).some(key => !allowed.includes(key))) {
    throw new Error("示例组合标记包含未声明字段");
  }
}
function materializeTemplate(template, referenceStack = [], depth = 0) {
  if (depth > 32) throw new Error("示例嵌套过深");
  if (template === null || typeof template !== "object") return template;
  const expand = value => materializeTemplate(value, referenceStack, depth + 1);
  if (Array.isArray(template)) return template.map(expand);

  if (Object.hasOwn(template, "$ref")) {
    requireAllowedKeys(template, ["$ref", "path"]);
    const id = template.$ref;
    if (!Object.hasOwn(fixtureTemplates, id) || referenceStack.includes(id)) {
      throw new Error("未知或循环的示例数据引用");
    }
    let value = materializeTemplate(
      fixtureTemplates[id], [...referenceStack, id], depth + 1
    );
    if (template.path !== undefined && !Array.isArray(template.path)) {
      throw new Error("示例路径必须是数组");
    }
    for (const key of template.path || []) {
      if (typeof key === "string") requireSafeKey(key);
      else if (!Number.isInteger(key) || key < 0) {
        throw new Error("非法示例数组索引");
      }
      if (value === null || typeof value !== "object" ||
          !Object.hasOwn(value, key)) {
        throw new Error("示例引用路径不存在");
      }
      value = value[key];
    }
    return structuredClone(value);
  }

  if (Object.hasOwn(template, "$base")) {
    requireAllowedKeys(template, ["$base", "$set", "$omit"]);
    const value = expand(template.$base);
    const changes = expand(template.$set || {});
    if (!value || Array.isArray(value) || typeof value !== "object" ||
        !changes || Array.isArray(changes) || typeof changes !== "object" ||
        (template.$omit !== undefined && !Array.isArray(template.$omit))) {
      throw new Error("示例对象组合结构无效");
    }
    for (const key of template.$omit || []) {
      requireSafeKey(key);
      if (!Object.hasOwn(value, key)) throw new Error("删除的示例字段不存在");
      delete value[key];
    }
    for (const [key, child] of Object.entries(changes)) {
      requireSafeKey(key);
      value[key] = child; // 显式替换整个字段；数组不拼接，对象不隐式深合并。
    }
    return value;
  }

  const value = {};
  for (const [key, child] of Object.entries(template)) {
    requireSafeKey(key);
    if (key.startsWith("$")) throw new Error("未知示例组合标记");
    value[key] = expand(child);
  }
  return value;
}

function taskKey(definition) {
  return definition.variant
    ? definition.action + ":" + definition.variant
    : definition.action;
}
function minimizeExampleInput(action, fullInput) {
  // 仅处理已验证的虚构示例，不接收或裁剪真实用户payload。
  const input = structuredClone(fullInput);
  const nullableOptional = [
    "requestedAt", "earliestStart", "availableWindows", "previousDayContext",
    "progressContext", "dailyWorkBudgetPomodoros", "statistics"
  ];
  for (const key of nullableOptional) {
    if (input[key] === null) delete input[key];
  }
  if (input.preparationMinutes === 0 && input.requestedAt === undefined &&
      input.earliestStart === undefined) {
    delete input.preparationMinutes;
  }
  if (action === "daily_review.generate" && input.generateNextTodos === false) {
    delete input.phasePlan;
    delete input.nextDayMilestone;
    delete input.planningProfile;
    delete input.progressContext;
    delete input.dailyWorkBudgetPomodoros;
  }
  if (input.phasePlan && [
    "daily_todo.initial", "daily_todo.generate", "daily_review.generate",
    "daily_todo.adjust", "daily_todo.intraday_adjust"
  ].includes(action)) {
    // 单日任务另有目标里程碑；其原始目标/约束/日期仍完整保留。
    delete input.phasePlan.milestones;
    if (Array.isArray(input.phasePlan.adjustments) &&
        input.phasePlan.adjustments.length === 0) {
      delete input.phasePlan.adjustments;
    }
  }
  if (action === "phase_plan.decompose" && input.plan) {
    for (const key of ["milestones", "adjustments"]) {
      if (Array.isArray(input.plan[key]) && input.plan[key].length === 0) {
        delete input.plan[key];
      }
    }
  }
  // 不删除必填空数组、[]窗口、0容量、原ID/状态、反馈、记录、
  // 原清单或有意义的阶段调整历史；不改变任何期望输出。
  return input;
}

function compileExample(id, definition) {
  const recipe = exampleById[id];
  if (!recipe || !recipe.actions.includes(definition.action) ||
      recipe.outputContract !== definition.outputContract ||
      recipe.version !== definition.promptVersion ||
      (definition.variant && !recipe.variants?.includes(definition.variant))) {
    throw new Error("示例与任务、变体或输出契约不兼容");
  }
  const businessInput = materializeTemplate(recipe.input);
  for (const key of ["action", "version", "promptVersion", "taskVariant"]) {
    if (Object.hasOwn(businessInput, key)) {
      throw new Error("示例业务字段不得覆盖元数据");
    }
  }
  const input = {
    ...businessInput,
    action: definition.action,
    version: 2,
    promptVersion: definition.promptVersion,
    ...(definition.variant ? { taskVariant: definition.variant } : {})
  };
  if (definition.action === "daily_todo.initial" &&
      input.date !== input.phasePlan?.startDate) {
    throw new Error("复用示例不满足阶段首日条件");
  }
  const output = materializeTemplate(recipe.output);
  validateExampleInput(definition, input);
  const minimalInput = minimizeExampleInput(definition.action, input);
  validateExampleInput(definition, minimalInput);
  validateExampleOutput(definition, minimalInput, output);
  return { id, input: minimalInput, output };
}

function renderSelectedExamples(definition) {
  const selected = exampleIdsByTask[taskKey(definition)];
  if (!selected) throw new Error("任务未注册示例选择规则");
  if (definition.exampleIds !== undefined &&
      JSON.stringify(definition.exampleIds) !== JSON.stringify(selected)) {
    throw new Error("任务定义与示例选择表不一致");
  }
  if (!selected.length) return [];
  return [
    boundaryText,
    ...selected.map((id, index) => {
      const example = compileExample(id, definition);
      return [
        "示例" + (index + 1) + "输入：",
        JSON.stringify(example.input),
        "示例" + (index + 1) + "期望输出：",
        JSON.stringify(example.output)
      ].join("\n");
    })
  ];
}
return { materializeTemplate, compileExample, renderSelectedExamples };
}
const exampleComposer = createExampleComposer({...examples, validateExampleInput:contracts.validateTaskInput, validateExampleOutput:contracts.validateOutput});
const composer = createPromptComposer({...registry, renderExamples:exampleComposer.renderSelectedExamples});
const compiled = new Map();
function compileSystem(action, variant) {
 const key = variant ? action+":"+variant : action;
 if (!compiled.has(key)) compiled.set(key, Object.freeze(composer.compileSystem(action, variant)));
 return compiled.get(key);
}
function buildMessages(action, rawPayload = {}) {
 const {definition, system} = compileSystem(action,rawPayload.taskVariant);
 const payload = contracts.normalizeTaskInput(definition,rawPayload);
 contracts.validateTaskInput(definition,payload);
 const business = contracts.pickDeclaredInputFields(definition,payload);
 const input={...business,action:definition.action,version:2,promptVersion:definition.promptVersion,...(definition.variant?{taskVariant:definition.variant}:{})};
 return [{role:"system",content:system},{role:"user",content:JSON.stringify(input)}];
}
function validateOutput(action, payload, result) {
 const {definition}=compileSystem(action,payload.taskVariant);
 contracts.validateOutput(definition,payload,result);
}
const api=Object.freeze({compileSystem,buildMessages,validateOutput,exampleComposer,definitions:registry.definitions});
if(typeof module !== "undefined" && module.exports) module.exports=api; else root.LlmPrompts=api;
})(globalThis);

