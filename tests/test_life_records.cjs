const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const sourceId = "11111111-1111-1111-1111-111111111111";
const store = {}, calls = [], pages = [];
const schema = { id: sourceId, properties: {
  "标题": { type: "title", title: {} }, "日期": { type: "date", date: {} },
  "用户完成情况": { type: "rich_text", rich_text: {} }, "今日总结": { type: "rich_text", rich_text: {} },
  "阶段计划 ID": { type: "rich_text", rich_text: {} }, "阶段计划名称": { type: "rich_text", rich_text: {} },
} };
let failWrites = false, duringPatch = null;
const fixed = Date.parse("2026-10-12T15:00:00+08:00");
class FixedDate extends Date {
  constructor(...args) { super(...(args.length ? args : [fixed])); }
  static now() { return fixed; }
}
const typed = (properties) => Object.fromEntries(Object.entries(properties).map(([key, value]) => [key, { ...value, type: Object.keys(value)[0] }]));
const text = (value) => ({ type: "rich_text", rich_text: [{ text: { content: value } }] });
const date = (value) => ({ type: "date", date: { start: value } });
const config = { token: "synthetic-token", dailyReviewSourceId: sourceId };
const sandbox = {
  Date: FixedDate, URL, AbortController, LlmPrompts: require("../llm-prompts.js"),
  setTimeout: (fn, ms) => { if (ms < 30000) queueMicrotask(fn); return 0; }, clearTimeout() {},
  chrome: { storage: { local: {
    get: async (keys) => keys == null ? structuredClone(store) : Object.fromEntries((typeof keys === "string" ? [keys] : keys).map((key) => [key, structuredClone(store[key])])),
    set: async (values) => Object.assign(store, structuredClone(values)),
  } } },
  fetch: async (url, options) => {
    const route = new URL(url).pathname.replace("/v1", "");
    const body = options.body ? JSON.parse(options.body) : null;
    calls.push({ route, method: options.method, body });
    let result;
    if (route === `/data_sources/${sourceId}`) {
      if (options.method === "PATCH") Object.assign(schema.properties, typed(body.properties));
      result = schema;
    } else if (route.endsWith("/query")) {
      result = { results: pages, has_more: false };
    } else if (route.startsWith("/pages/") && options.method === "PATCH") {
      if (failWrites) throw new Error("Synthetic offline failure");
      if (duringPatch) { const action = duringPatch; duringPatch = null; await action(); }
      const page = pages.find((item) => route.endsWith(item.id));
      Object.assign(page.properties, typed(body.properties));
      result = page;
    } else if (route === "/pages" && options.method === "POST") {
      if (failWrites) throw new Error("Synthetic offline failure");
      result = { id: `test-page-${pages.length}`, url: "https://www.notion.so/test-life", last_edited_time: new FixedDate().toISOString(), properties: typed(body.properties) };
      pages.push(result);
    } else throw new Error(`Unexpected synthetic request ${route}`);
    return { ok: true, status: 200, json: async () => structuredClone(result) };
  },
};
sandbox.globalThis = sandbox;
const code = fs.readFileSync(path.join(__dirname, "../notion-client.js"), "utf8")
  .replace("  global.MinimalPomodoroNotion = Object.freeze({", "  global.__lifeTests = { lifeRecordFromPages, buildDailyArchiveMarkdown, buildDailyArchiveBlocks };\n  global.MinimalPomodoroNotion = Object.freeze({");
vm.runInNewContext(code, sandbox);
const api = sandbox.MinimalPomodoroNotion, key = "minimalPomodoroLifeRecords:2026-10-12";
(async () => {
  const original = "  睡眠 7 小时\n早餐鸡蛋；午饭米饭\n心情不错，没有喝甜水。\n\n";
  await api.queueLifeRecord("2026-10-12", original);
  assert.equal(store[key].text, original);
  assert.equal(store[key].pendingSync, true);
  assert.equal((await api.getQueuedWrites()).length, 1);
  await api.queueLifeRecord("2026-10-12", original + "补充晚饭");
  assert.equal((await api.getQueuedWrites()).length, 1, "Repeated edits coalesce by date");
  assert.equal(await api.cacheLifeRecord("2026-10-12", { text: "stale remote" }), null);
  await api.queueLifeRecord("2026-10-12", original);
  let summary = await api.flushWriteQueue(config);
  assert.equal(summary.succeeded, 1, JSON.stringify(summary));
  assert.equal(store[key].pendingSync, false);
  assert.equal((await api.getQueuedWrites()).length, 0);
  assert.equal(schema.properties["生活记录"].type, "rich_text", "Missing field upgrades on first write");
  assert.equal(sandbox.__lifeTests.lifeRecordFromPages("2026-10-12", pages).text, original, "Whitespace and newlines survive a Notion roundtrip");
  pages[0].properties["用户完成情况"] = text("原有工作完成情况");
  pages[0].properties["今日总结"] = text("原有总结");
  pages.push({ id: "old-duplicate", url: "https://www.notion.so/test-duplicate", last_edited_time: "2026-10-11T00:00:00Z", properties: { "日期": date("2026-10-12"), "生活记录": text("旧记录") } });
  await api.queueLifeRecord("2026-10-12", "新生活记录");
  await api.flushWriteQueue(config);
  assert.equal(pages[0].properties["用户完成情况"].rich_text[0].text.content, "原有工作完成情况");
  assert.equal(pages[0].properties["今日总结"].rich_text[0].text.content, "原有总结");
  assert.equal(pages[1].properties["生活记录"].rich_text[0].text.content, "新生活记录");
  for (const call of calls.filter((item) => item.route.startsWith("/pages/") && item.method === "PATCH"))
    assert.deepEqual(Object.keys(call.body.properties), ["生活记录"], "Life sync cannot overwrite work fields");
  await api.queueLifeRecord("2026-10-12", "");
  await api.flushWriteQueue(config);
  assert.equal(sandbox.__lifeTests.lifeRecordFromPages("2026-10-12", pages).text, "");
  assert.equal(pages[1].properties["生活记录"].rich_text.length, 0, "Clearing includes duplicate rows");
  await api.queueLifeRecord("2026-10-12", "离线原文");
  failWrites = true;
  summary = await api.flushWriteQueue(config);
  assert.equal(summary.failed, 1);
  assert.equal(store[key].text, "离线原文");
  assert.equal(store[key].pendingSync, true);
  assert.equal((await api.getQueuedWrites()).length, 1);
  failWrites = false;
  await api.flushWriteQueue(config);
  assert.equal(store[key].pendingSync, false);
  assert.equal(await api.cacheLifeRecord("2026-10-12", { text: "stale after flush", updatedAt: "2026-10-11T00:00:00.000Z" }), null, "An old cloud read cannot replace a just-synced local revision");
  await api.queueLifeRecord("2026-10-12", "正在同步的旧文本");
  duringPatch = () => api.queueLifeRecord("2026-10-12", "同步时新输入");
  await api.flushWriteQueue(config);
  assert.equal(store[key].text, "同步时新输入");
  assert.equal(store[key].pendingSync, true);
  assert.equal((await api.getQueuedWrites()).length, 1, "A new revision with the same timestamp stays queued");
  await api.flushWriteQueue(config);
  assert.equal(store[key].pendingSync, false);
  const remote = await api.loadLifeRecordsInRange("2026-10-12", "2026-10-18", config);
  assert.equal(remote.length, 1, "Duplicate days display once");
  assert.equal(remote[0].text, "同步时新输入");
  const long = "a".repeat(18000);
  await api.queueLifeRecord("2026-10-12", long);
  await api.flushWriteQueue(config);
  assert.equal(pages[0].properties["生活记录"].rich_text.length, 10);
  assert.equal(sandbox.__lifeTests.lifeRecordFromPages("2026-10-12", pages).text, long);
  await assert.rejects(() => api.queueLifeRecord("2026-10-12", "a".repeat(18001)), /18000/);
  assert.equal(store[key].text, long, "Reject length overflow without truncation");
  const archive = { date: "2026-10-12", generatedAt: new FixedDate().toISOString(), phasePlan: null, metrics: { totalMinutes: 0, workMinutes: 0, todoCount: 0, completedTodoCount: 0, pomodoroCount: 0 }, todos: [], records: [], review: {}, lifeRecord: original };
  assert.ok(sandbox.__lifeTests.buildDailyArchiveMarkdown(archive).includes(original));
  assert.ok(JSON.stringify(sandbox.__lifeTests.buildDailyArchiveBlocks(archive)).includes("生活记录"));
  schema.properties["生活记录"] = { type: "select", select: {} };
  await api.queueLifeRecord("2026-10-12", "字段类型冲突时保留本地原文");
  summary = await api.flushWriteQueue(config);
  assert.equal(summary.failed, 1);
  assert.equal(schema.properties["生活记录"].type, "select", "A pre-existing incompatible field is never converted");
  assert.equal(store[key].pendingSync, true);
  console.log("Life records: durable local queue, schema upgrade, exact text, partial patches, duplicate dates, clear, offline retry, in-flight revision, range pull, length limit and archive passed (synthetic data only)");
})().catch((error) => { console.error(error); process.exitCode = 1; });
