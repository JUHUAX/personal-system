const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const prompts = require("../llm-prompts.js");
const examples = require("../llm-prompt-examples.js");
const clone = structuredClone;
function example(id) {
  const recipe=examples.exampleRecipes.find(e=>e.id===id);
  const definition=prompts.definitions.find(d=>d.action===recipe.actions[0] && d.outputContract===recipe.outputContract);
  return prompts.exampleComposer.compileExample(id,definition);
}
for(const recipe of examples.exampleRecipes) example(recipe.id);
const papers=example("E.PHASE_ALL_TASKS_PROGRESS");
assert.deepEqual(papers.output.milestones.map(m=>m.taskProgress[0].targetProgressPercent),[50,100,100,100,50,100]);
assert.equal(papers.output.milestones[0].taskProgress[0].taskId,papers.output.milestones[1].taskProgress[0].taskId);
assert.notEqual(papers.output.milestones[1].taskProgress[0].taskId,papers.output.milestones[2].taskProgress[0].taskId);
const research=example("E.PHASE_MULTI_RESEARCH_PROGRESS");
assert.equal(research.output.milestones[0].taskProgress.length,5);
assert.ok(research.output.milestones[0].taskProgress.every(t=>t.targetProgressPercent===50));
assert.ok(research.output.milestones[1].taskProgress.every(t=>t.targetProgressPercent===100));
assert.equal(research.output.milestones[0].targetProgressPercent,null,"No fabricated aggregate for unrelated tasks");
assert.equal(research.output.milestones[0].estimatedMinutes,null);
const verify=(result,input=papers.input)=>prompts.validateOutput("phase_plan.decompose",input,result);
for(const mode of ["explicit","percentage"]) {
  const r=clone(papers.output);r.milestones[0].planningMode=mode;r.milestones[0].taskProgress[0].targetProgressPercent=null;
  assert.throws(()=>verify(r),/数字累计预期百分比/);
}
const missing=clone(papers.output);delete missing.milestones[0].taskProgress;
assert.throws(()=>verify(missing),/字段缺失/);
const empty=clone(papers.output);empty.milestones[0].taskProgress=[];empty.milestones[0].targetProgressPercent=null;
assert.throws(()=>verify(empty),/不能用空数组/);
const duplicated=clone(research.output);duplicated.milestones[0].taskProgress.push(clone(duplicated.milestones[0].taskProgress[0]));
assert.throws(()=>verify(duplicated,research.input),/同日ID重复/);
const aggregate=clone(research.output);aggregate.milestones[0].targetProgressPercent=50;
assert.throws(()=>verify(aggregate,research.input),/不能混成统一进度/);
const changedId=clone(papers.output);changedId.milestones[1].taskProgress[0].taskId="new-id";
assert.throws(()=>verify(changedId),/更换ID/);
const decrease=clone(papers.output);decrease.milestones[1].taskProgress[0].targetProgressPercent=40;decrease.milestones[1].targetProgressPercent=40;
assert.throws(()=>verify(decrease),/倒退/);
const unfinished=clone(papers.output);unfinished.milestones[5].taskProgress[0].targetProgressPercent=80;unfinished.milestones[5].targetProgressPercent=80;
assert.throws(()=>verify(unfinished),/最后推进日/);
const suppliedInput=clone(papers.input);suppliedInput.plan.constraints="修改方案在阶段结束日预期80%，用户指定。";
verify(unfinished,suppliedInput);
const missingDate=clone(papers.output);missingDate.milestones.splice(2,1);
assert.throws(()=>verify(missingDate),/日期必须完整覆盖/);
const todo=example("E.TODO_WITH_UNKNOWN_PROGRESS");
const invalidTodo=clone(todo.output);invalidTodo.todos[0].targetProgressPercent=null;
assert.throws(()=>prompts.validateOutput(todo.input.action,todo.input,invalidTodo),/数字累计预期/);
const wrongTask=clone(todo.output);wrongTask.todos[0].phaseTaskId="unknown-task";
assert.throws(()=>prompts.validateOutput(todo.input.action,todo.input,wrongTask),/阶段任务ID/);

// Exercise the real phase cleaner and Notion JSON serializer; no external writes.
const sandbox={LlmPrompts:prompts,URL,AbortController,setTimeout,clearTimeout,Intl};sandbox.globalThis=sandbox;
const code=fs.readFileSync(require.resolve("../notion-client.js"),"utf8").replace("  global.MinimalPomodoroNotion = Object.freeze({","  global.toolsForTest={cleanMilestone,buildPhasePlanProperties,buildDailyArchiveMarkdown,buildDailyArchiveBlocks};\n  global.MinimalPomodoroNotion = Object.freeze({");
vm.runInNewContext(code,sandbox);
const t=sandbox.toolsForTest;
const cleaned=research.output.milestones.map(t.cleanMilestone);
assert.deepEqual(JSON.parse(JSON.stringify(cleaned.map(m=>m.taskProgress))),research.output.milestones.map(m=>m.taskProgress));
const schema={"计划":{type:"title"},"每日里程碑 JSON":{type:"rich_text"}};
const saved=t.buildPhasePlanProperties({...research.input.plan,milestones:cleaned},schema);
const stored=JSON.parse(saved.properties["每日里程碑 JSON"].rich_text.map(x=>x.text.content).join(""));
assert.deepEqual(stored.map(m=>m.taskProgress),research.output.milestones.map(m=>m.taskProgress));
assert.throws(()=>t.buildPhasePlanProperties({...research.input.plan,milestones:Array.from({length:100},()=>cleaned[0])},schema),/未截断JSON/);
const archive={date:"2026-11-02",generatedAt:"2026-11-02T12:00:00+08:00",phasePlan:{title:"科研"},dayMilestone:cleaned[0],records:[],todos:[],review:{},lifeRecord:"",metrics:{totalMinutes:0,workMinutes:0,completedTodoCount:0,todoCount:0,pomodoroCount:0}};
assert.match(t.buildDailyArchiveMarkdown(archive),/behavfuzz：累计预期 50%/);
assert.match(JSON.stringify(t.buildDailyArchiveBlocks(archive)),/stateweaver：累计预期 50%/);
console.log("Task progress: every task has a numeric target, independent curves, stable IDs, legacy mirror, date/range/monotonic checks, todo linkage and phase JSON round trip passed");
