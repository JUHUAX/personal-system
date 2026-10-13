const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const prompts = require("../llm-prompts.js");
const contracts = require("../llm-prompt-contracts.js");
const clone = structuredClone;
const example = (key,id) => {
  const d = prompts.definitions.find(d=>d.key===key);
  return prompts.exampleComposer.compileExample(id || d.exampleIds[0],d);
};
for(const d of prompts.definitions) {
  const rendered=prompts.compileSystem(d.action,d.variant);
  assert.ok(!/\$ref|\$base|\[object Object\]|undefined/.test(rendered.system));
  for(const id of d.exampleIds) {
    const e=example(d.key,id);
    const messages=prompts.buildMessages(d.action,e.input);
    assert.equal(messages[0].content,rendered.system);
    prompts.validateOutput(d.action,e.input,e.output);
  }
}
const day = example("daily_todo.generate","E.TODO_WITH_UNKNOWN_PROGRESS");
const normal=prompts.buildMessages("daily_todo.generate",day.input);
const input=JSON.parse(normal[1].content);
const malicious=prompts.buildMessages("daily_todo.generate",{...day.input,action:"phase_plan.summarize",version:1,promptVersion:"old",secret:"must-not-send"});
assert.deepEqual(JSON.parse(malicious[1].content),input);
const retry=prompts.buildMessages("daily_todo.generate",{...day.input,outputLengthFeedback:"压缩文字",previousResult:day.output});
assert.equal(normal[0].content,retry[0].content);
assert.equal(JSON.parse(retry[1].content).previousResult.todos[0].effortBasis,"unknown");
const kept=prompts.buildMessages("daily_todo.generate",{...day.input,availableWindows:[],progressContext:null,dailyWorkBudgetPomodoros:0,previousDayContext:{records:[{start:0,end:60000}],todos:[],userCompletion:""}});
const keptInput=JSON.parse(kept[1].content);
assert.deepEqual(keptInput.availableWindows,[]); assert.equal(keptInput.progressContext,null); assert.equal(keptInput.dailyWorkBudgetPomodoros,0);
assert.equal(keptInput.previousDayContext.records[0].start,"1970-01-01T00:00:00.000Z");
assert.throws(()=>prompts.buildMessages("daily_todo.intraday_repair",{}),/未注册/);
assert.throws(()=>prompts.buildMessages("daily_todo.generate",{date:input.date}),/缺少phasePlan/);
assert.throws(()=>prompts.exampleComposer.materializeTemplate({$ref:"F.UNKNOWN"}),/未知/);
assert.throws(()=>prompts.exampleComposer.materializeTemplate({$ref:"F.PROFILE",path:["__proto__"]}),/非法|未知/);
assert.throws(()=>example("phase_plan.decompose","E.TODO_WITH_UNKNOWN_PROGRESS"),/不兼容/);
const again=example("daily_todo.generate","E.TODO_WITH_UNKNOWN_PROGRESS");
again.input.phasePlan.description="changed";
assert.notEqual(example("daily_todo.generate","E.TODO_WITH_UNKNOWN_PROGRESS").input.phasePlan.description,"changed");
for(const [a,b] of [["daily_todo.initial","daily_todo.generate"],["phase_plan.decompose","phase_plan.adjust"],["daily_todo.adjust","daily_todo.adjust_repair"],["daily_todo.intraday_adjust","daily_todo.intraday_repair:auto_delta"],["daily_review.generate","phase_plan.summarize"]]) {
  const render = key=>{const d=prompts.definitions.find(d=>d.key===key);return prompts.compileSystem(d.action,d.variant);};
  assert.equal(render(a).prefix,render(b).prefix,a+" shared prefix");
}
for(const variant of ["auto_delta","initial_generate","day_generate"]) {
  const source=variant==="auto_delta"?example("daily_todo.intraday_adjust"):day;
  const payload={...source.input,taskVariant:variant,currentTime:"2026-10-12T09:00:00+08:00",availableWindows:[],candidateTodos:source.output.todos,validationError:"时间冲突",deletedTodoIds:[],todos:source.input.todos || [...(source.input.protectedTodos || []),...(source.input.adjustableTodos || [])]};
  const messages=prompts.buildMessages("daily_todo.intraday_repair",payload);
  assert.equal(JSON.parse(messages[1].content).taskVariant,variant);
  const d=prompts.definitions.find(d=>d.variant===variant);
  assert.equal(d.outputContract,variant==="auto_delta"?"O.AUTO_DELTA":"O.DAY_GENERATE");
}
const invalid=clone(day.output); invalid.todos[0].estimatedPomodoros=0;
assert.throws(()=>prompts.validateOutput("daily_todo.generate",day.input,invalid),/未知投入/);
const extra=clone(day.output); extra.deletedTodoIds=[];
assert.throws(()=>prompts.validateOutput("daily_todo.generate",day.input,extra),/字段/);
const altered=clone(day.output); altered.todos[0].priority="high";
assert.throws(()=>prompts.validateOutput("daily_todo.generate",{...day.input,outputLengthFeedback:"压缩",previousResult:day.output},altered),/长度重试改变/);
const review=example("daily_review.generate","E.REVIEW_STATUS_CONFLICT");
const illegalReview=clone(review.output); illegalReview.nextDayTodos=day.output.todos;
assert.throws(()=>prompts.validateOutput("daily_review.generate",review.input,illegalReview),/只复盘/);

// Real client cleaners and Notion property round trip, using only synthetic records.
const schema={"待办":{type:"title"},"日期":{type:"date"},"待办 ID":{type:"rich_text"},"预计番茄数":{type:"number"},"规划方式":{type:"select"},"累计计划百分比":{type:"number"},"投入依据":{type:"select"},"计划时间":{type:"date"},"阶段任务 ID":{type:"rich_text"}};
const sandbox={LlmPrompts:prompts,URL,AbortController,setTimeout,clearTimeout,Intl,console,chrome:{storage:{local:{get:async()=>({})}}}};
sandbox.globalThis=sandbox;
let code=fs.readFileSync(require.resolve("../notion-client.js"),"utf8").replace("  global.MinimalPomodoroNotion = Object.freeze({",`
  global.testTools={cleanLlmTodos,cleanMilestone,buildDailyTodoProperties,validateAdjustedMilestones,validateTodoSchedules};
  resolveDataSource=async()=>({id:"synthetic",properties:global.syntheticSchema});
  queryDataSource=async()=>[global.syntheticPage];
  global.MinimalPomodoroNotion = Object.freeze({`);
vm.runInNewContext(code,sandbox);
const t=sandbox.testTools;
const percentage=t.cleanLlmTodos(day.output.todos)[0];
assert.equal(percentage.plannedStart,null); assert.equal(percentage.estimatedPomodoros,null);
const props=t.buildDailyTodoProperties(input.date,{...percentage,id:"synthetic:1"},schema);
assert.equal(props["预计番茄数"].number,null); assert.equal(props["计划时间"].date,null);
assert.equal(props["累计计划百分比"].number,percentage.targetProgressPercent);
const phase=example("phase_plan.decompose","E.PHASE_WITHOUT_SCHEDULE");
const milestones=phase.output.milestones.map(t.cleanMilestone);
assert.equal(milestones[0].estimatedMinutes,null);
t.validateAdjustedMilestones(milestones,phase.input.plan.startDate,phase.input.plan.endDate);
assert.throws(()=>t.validateAdjustedMilestones([...milestones,milestones[0]],phase.input.plan.startDate,phase.input.plan.endDate),/重复/);
const scheduled={...percentage,effortBasis:"time_budget",estimatedPomodoros:2,plannedStart:`${input.date}T09:00:00+08:00`,plannedEnd:`${input.date}T09:25:00+08:00`};
assert.throws(()=>t.validateTodoSchedules(input.date,[scheduled],{workWindows:[{weekdays:[0,1,2,3,4,5,6],start:"09:00",end:"18:00"}]}),/内部休息/);
sandbox.syntheticSchema=schema;
sandbox.syntheticPage={id:"synthetic:1",properties:Object.fromEntries(Object.entries(props).map(([k,v])=>[k,{...v,...(v.rich_text?{rich_text:v.rich_text.map(x=>({...x,plain_text:x.text.content}))}:{}),type:Object.keys(v)[0]}]))};
(async()=>{
  const loaded=await sandbox.MinimalPomodoroNotion.loadDailyTodos(input.date,{dailyPlanSourceId:"synthetic"});
  assert.equal(loaded[0].planningMode,"percentage"); assert.equal(loaded[0].effortBasis,"unknown");
  assert.equal(loaded[0].targetProgressPercent,percentage.targetProgressPercent);
  assert.equal(loaded[0].phaseTaskId,percentage.phaseTaskId);
  assert.equal(loaded[0].estimatedPomodoros,null); assert.equal(loaded[0].plannedStart,null);
  console.log("V2 composer: reusable recipes, 13 variants, stable prefixes, input isolation, strict contracts, task linkage/null storage round trip and schedule duration passed");
})().catch(e=>{console.error(e);process.exitCode=1;});
