const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");
const prompts = require("../llm-prompts.js");
const root = path.resolve(__dirname, "..");
const calls = [];
let replies = [];
let saved = [];
const date = "2026-10-12";
const profile = { workWindows: [], routineBlocks: [], dateOverrides: [] };
const sandbox = {
  LlmPrompts: prompts, URL, AbortController, setTimeout, clearTimeout,
  Intl, console,
  fetch: async (_url, options) => {
    calls.push(JSON.parse(options.body));
    return { ok: true, json: async () => ({ choices: [{ message: { content: JSON.stringify(replies.shift()) } }] }) };
  },
};
sandbox.globalThis = sandbox;
const original = fs.readFileSync(path.join(root, "notion-client.js"), "utf8");
const source = original.replace("const loadPhasePlan = loadWeeklyPlan;", "let loadPhasePlan = loadWeeklyPlan;").replace("  global.MinimalPomodoroNotion = Object.freeze({", `
  global.testFunctions = { callLlm, validateTodoSchedules, manualPlanningWindow };
  loadPhasePlan = async () => ({ planId: "plan:test", startDate: "${date}", endDate: "${date}", description: "修改论文", milestones: [{ date: "${date}" }] });
  loadDailyTodos = async () => [];
  loadAllLocalRecords = async () => [];
  loadDailyReview = async () => ({ userCompletion: "", dailySummary: "" });
  loadPlanningProfile = async () => global.testProfile;
  upsertDailyTodos = async (_date, todos) => { global.savedTodos = todos; return { created: todos.length, updated: 0 }; };
  global.MinimalPomodoroNotion = Object.freeze({`);
sandbox.testProfile = profile;
vm.runInNewContext(source, sandbox);
const config = { llmEndpoint: "https://example.invalid/chat/completions", llmModel: "fake-model", llmApiKey: "test-only" };
const todo = (extra = {}) => ({ planningMode: "explicit", targetProgressPercent: 100, phaseTaskId: null, effortBasis: "task_estimate", priority: "medium", source: "phase_plan", origin: "llm", title: "修改论文", details: "核对摘要", plannedStart: `${date}T20:00:00+08:00`, plannedEnd: `${date}T20:25:00+08:00`, estimatedPomodoros: 1, workWindowOverride: true, ...extra });
const delta = (todos) => ({ status: "ok", blockedReason: "", changeSummary: "调整时间", todos, deletedTodoIds: [], warnings: [] });
const day = (todos) => ({ status: "ok", blockedReason: "", todos, fixedSchedule: [], deferredTodos: [], warnings: [] });
const manualInput = { date, instruction: "20:00修改论文", todos: [], protectedTodos: [], adjustableTodos: [], requiredRescheduleTodos: [] };
const dayInput = { date, phasePlan: { startDate: date }, dayMilestone: { date } };
const dayTodo = (extra) => { const t=todo(extra); delete t.workWindowOverride; return t; };

(async () => {
  replies = [delta([todo({ details: "长".repeat(81) })]), delta([todo()])];
  const compacted = await sandbox.testFunctions.callLlm("daily_todo.adjust", manualInput, config);
  assert.equal(calls.length, 2);
  for (const request of calls) {
    assert.deepEqual(request.thinking, { type: "enabled" }, "Normal and retry requests must explicitly enable thinking");
    assert.equal(request.reasoning_effort, "medium", "Normal and retry requests must request medium reasoning effort");
  }
  assert.equal(compacted.todos[0].details, "核对摘要");
  assert.match(calls[1].messages[1].content, /outputLengthFeedback/);
  assert.match(calls[0].messages[0].content, /覆盖/);
  assert.equal(calls[0].messages[0].content,calls[1].messages[0].content);
  assert.equal(JSON.parse(calls[1].messages[1].content).previousResult.todos[0].details.length,81);
  assert.equal(calls[0].messages[0].content.includes("并且只能使用 availableWindows"), false);
  replies = [day([dayTodo({ title: "长".repeat(29) })]), day([dayTodo({ title: "长".repeat(29) })])];
  await assert.rejects(() => sandbox.testFunctions.callLlm("daily_todo.generate", dayInput, config), /最多28/);
  assert.equal(calls.length, 4, "Length repair is bounded to one retry");
  replies = [delta([todo()])];
  const preview = await sandbox.MinimalPomodoroNotion.previewTodoAdjustment(date, "20:00修改论文", config, { requestedAt: `${date}T19:00:00+08:00`, preparationMinutes: 0 });
  assert.equal(preview.todos[0].workWindowOverride, true);
  assert.match(preview.warnings.join(""), /工作窗口外/);
  await sandbox.MinimalPomodoroNotion.applyTodoAdjustment(date, preview.todos, "20:00修改论文", config);
  saved = sandbox.savedTodos;
  assert.equal(saved.length, 1);
  assert.throws(() => sandbox.testFunctions.validateTodoSchedules(date, [todo()], profile), /工作窗口/);
  assert.throws(() => sandbox.testFunctions.manualPlanningWindow(date, `${date}T19:00:00+08:00`, profile, 0), /工作窗口/);
  // A future-day repair receives the original instruction and deletion set,
  // rather than falling back to automatic intraday window rules.
  replies = [delta([todo({ workWindowOverride: false })]), delta([todo()])];
  const repaired = await sandbox.MinimalPomodoroNotion.previewTodoAdjustment(date, "20:00到20:25修改论文", config);
  assert.equal(repaired.todos.length, 1);
  assert.match(calls.at(-1).messages[1].content, /daily_todo.adjust_repair/);
  assert.match(calls.at(-1).messages[1].content, /20:00到20:25修改论文/);
  const blockedProfile = { ...profile, routineBlocks: [{ weekdays: [1], start: "20:00", end: "21:00" }] };
  assert.throws(() => sandbox.testFunctions.validateTodoSchedules(date, [todo()], blockedProfile, { allowWorkWindowOverrides: true }), /冲突/);
  const phasePlan = { planId: "plan:test", startDate: date, endDate: date, description: "修改论文", milestones: [{date,planningMode:"percentage",targetProgressPercent:100,goal:"修改论文累计计划100%"}] };
  const unknown = dayTodo({planningMode:"percentage",targetProgressPercent:100,effortBasis:"unknown",estimatedPomodoros:null,plannedStart:null,plannedEnd:null});
  replies=[day([unknown])];
  await sandbox.MinimalPomodoroNotion.generateDayTodos(date,config,{phasePlan,action:"daily_todo.initial"});
  assert.equal(sandbox.savedTodos[0].estimatedPomodoros,null);
  assert.equal(sandbox.savedTodos[0].plannedStart,null);
  sandbox.testProfile={...profile,workWindows:[{weekdays:[1],start:"09:00",end:"18:00"}]};
  for(const action of ["daily_todo.initial","daily_todo.generate"]) {
    replies=[day([dayTodo()]),day([dayTodo({plannedStart:`${date}T09:00:00+08:00`,plannedEnd:`${date}T09:25:00+08:00`})])];
    await sandbox.MinimalPomodoroNotion.generateDayTodos(date,config,{phasePlan,action});
    const request=JSON.parse(calls.at(-1).messages[1].content);
    assert.equal(request.taskVariant,action === "daily_todo.initial"?"initial_generate":"day_generate");
    assert.equal(request.phasePlan.planId,phasePlan.planId);
    assert.deepEqual(request.fixedSchedule,[]);
    assert.deepEqual(request.deferredTodos,[]);
  }
  for (const request of calls) {
    assert.deepEqual(request.thinking, { type: "enabled" }, "Generation, adjustment and repair must use thinking mode");
    assert.equal(request.reasoning_effort, "medium", "Generation, adjustment and repair must request medium reasoning effort");
  }
  console.log("Extension work prompts: thinking requests with medium effort, bounded compression retry, manual preview/apply, repair context, window and conflict checks passed");
})().catch((error) => { console.error(error); process.exitCode = 1; });
