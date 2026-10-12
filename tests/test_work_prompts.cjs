const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");
const policy = require("../work-prompt-policy.js");
const root = path.resolve(__dirname, "..");
const calls = [];
let replies = [];
let saved = [];
const date = "2026-10-12";
const profile = { workWindows: [], routineBlocks: [], dateOverrides: [] };
const sandbox = {
  WorkPromptPolicy: policy, URL, AbortController, setTimeout, clearTimeout,
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
  loadPhasePlan = async () => ({ planId: "plan:test", milestones: [{ date: "${date}" }] });
  loadDailyTodos = async () => [];
  loadPlanningProfile = async () => global.testProfile;
  upsertDailyTodos = async (_date, todos) => { global.savedTodos = todos; return { created: todos.length, updated: 0 }; };
  global.MinimalPomodoroNotion = Object.freeze({`);
sandbox.testProfile = profile;
vm.runInNewContext(source, sandbox);
const config = { llmEndpoint: "https://example.invalid/chat/completions", llmModel: "fake-model", llmApiKey: "test-only" };
const todo = (extra = {}) => ({ title: "修改论文", details: "核对摘要", plannedStart: `${date}T20:00:00+08:00`, plannedEnd: `${date}T20:25:00+08:00`, estimatedPomodoros: 1, workWindowOverride: true, ...extra });

(async () => {
  replies = [{ status: "ok", todos: [todo({ details: "长".repeat(81) })] }, { status: "ok", todos: [todo()] }];
  const compacted = await sandbox.testFunctions.callLlm("daily_todo.adjust", { date, instruction: "20:00修改论文" }, config);
  assert.equal(calls.length, 2);
  assert.equal(compacted.todos[0].details, "核对摘要");
  assert.match(calls[1].messages[1].content, /outputLengthFeedback/);
  assert.match(calls[0].messages[0].content, /用户明确指定的时间可以覆盖/);
  assert.equal(calls[0].messages[0].content.includes("并且只能使用 availableWindows"), false);
  replies = [{ status: "ok", todos: [todo({ title: "长".repeat(29) })] }, { status: "ok", todos: [todo({ title: "长".repeat(29) })] }];
  await assert.rejects(() => sandbox.testFunctions.callLlm("daily_todo.generate", { date }, config), /上限 28/);
  assert.equal(calls.length, 4, "Length repair is bounded to one retry");
  replies = [{ status: "ok", todos: [todo()] }];
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
  replies = [{ status: "ok", todos: [todo({ plannedEnd: `${date}T19:00:00+08:00` })], deletedTodoIds: [] }, { status: "ok", todos: [todo()] }];
  const repaired = await sandbox.MinimalPomodoroNotion.previewTodoAdjustment(date, "20:00到20:25修改论文", config);
  assert.equal(repaired.todos.length, 1);
  assert.match(calls.at(-1).messages[1].content, /daily_todo.adjust_repair/);
  assert.match(calls.at(-1).messages[1].content, /20:00到20:25修改论文/);
  const blockedProfile = { ...profile, routineBlocks: [{ weekdays: [1], start: "20:00", end: "21:00" }] };
  assert.throws(() => sandbox.testFunctions.validateTodoSchedules(date, [todo()], blockedProfile, { allowWorkWindowOverrides: true }), /冲突/);
  console.log("Extension work prompts: bounded compression retry, manual preview/apply, repair context, window and conflict checks passed");
})().catch((error) => { console.error(error); process.exitCode = 1; });
