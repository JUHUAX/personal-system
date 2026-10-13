const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
const { chromium } = require("playwright");
const root = path.resolve(__dirname, "..");
const server = http.createServer((req, res) => {
  const name = new URL(req.url, "http://localhost").pathname;
  const file = path.resolve(root, `.${name}`);
  if (!file.startsWith(root + path.sep) || !/\.(html|css|js|png)$/.test(file) || !fs.existsSync(file)) {
    res.writeHead(404); res.end(); return;
  }
  let content = fs.readFileSync(file);
  if (name === "/notion-integration.js") content = content.toString().replace("  function escapeNotionHtml(value)",
    "  globalThis.__notionTests = { renderPhaseDatabase, renderFlowTodos, renderFlowReview, renderTodos, renderWeeklyPlan, storeLocalTodos };\n  function escapeNotionHtml(value)");
  res.setHeader("Content-Type", ({ ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".png": "image/png" })[path.extname(file)]);
  res.end(content);
});

(async () => {
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const url = `http://127.0.0.1:${server.address().port}`;
  const executablePath = process.env.BROWSER_EXECUTABLE || [
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
  ].find(fs.existsSync);
  const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 980 }, timezoneId: "Asia/Shanghai" });
    await context.addInitScript(() => {
      const host = window.top;
      if (!host.__mockStore) {
        host.__clock = "2026-10-12T15:00:00+08:00";
        host.__opened = []; host.__writes = []; host.__listeners = [];
        host.__mockStore = JSON.parse(sessionStorage.getItem("__persistedMockStore") || "null") || {
          "minimalPomodoroInspirations:2026-10-09": "历史灵感 A\n第二行",
          "minimalPomodoroInspirations:2026-10-10": "",
          "minimalPomodoroInspirations:2026-10-12": "今天的灵感 B",
          "minimalPomodoroLifeRecords:2026-10-09": { schemaVersion: 1, date: "2026-10-09", text: "历史生活记录：睡眠八小时，三餐规律。", pendingSync: false },
          "minimalPomodoroTimeline:2026-10-12": [{ id: "test-record", type: "work", content: "虚构工作", start: Date.parse("2026-10-12T10:00:00+08:00"), end: Date.parse("2026-10-12T10:25:00+08:00"), round: 9, completion: "high", focus: "good", interruption: "none", reviewPending: true, reviewNote: "以前的完成情况" }],
        };
      }
      const NativeDate = Date;
      window.Date = class extends NativeDate {
        constructor(...args) { super(...(args.length ? args : [host.__clock])); }
        static now() { return NativeDate.parse(host.__clock); }
      };
      window.chrome = {
        storage: {
          local: {
            get: async (keys) => {
              if (keys == null) return structuredClone(host.__mockStore);
              const list = typeof keys === "string" ? [keys] : Array.isArray(keys) ? keys : Object.keys(keys);
              return Object.fromEntries(list.map((key) => [key, host.__mockStore[key] ?? (keys && !Array.isArray(keys) && typeof keys === "object" ? keys[key] : undefined)]));
            },
            set: async (values) => {
              if (host.__failSave && Object.keys(values).some((key) => key.startsWith("minimalPomodoroInspirations:") || key.startsWith("minimalPomodoroLifeRecords:"))) throw new Error("虚构保存失败");
              if (host.__failQueue && Object.keys(values).includes("minimalPomodoroNotionWriteQueue:v1")) throw new Error("虚构队列保存失败");
              const changes = Object.fromEntries(Object.entries(values).map(([key, newValue]) => [key, { oldValue: host.__mockStore[key], newValue }]));
              Object.assign(host.__mockStore, structuredClone(values));
              host.__writes.push(structuredClone(values));
              for (const listener of host.__listeners) listener(changes, "local");
            },
            remove: async (keys) => { for (const key of Array.isArray(keys) ? keys : [keys]) delete host.__mockStore[key]; },
          }, onChanged: { addListener: (fn) => host.__listeners.push(fn) },
        },
        runtime: { getURL: (file) => location.origin + "/" + file, sendMessage: async () => ({ ok: true }), onMessage: { addListener() {} } },
        tabs: { create: async (options) => { host.__opened.push(options); return {}; } },
        idle: { onStateChanged: { addListener() {} }, setDetectionInterval() {} },
      };
    });
    const page = await context.newPage(), errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(url + "/timeline.html?mode=inspiration");
    const editor = page.locator("#inspirationNotebook");
    await editor.waitFor({ state: "visible" });
    await page.waitForFunction(() => document.querySelector("#inspirationNotebook").value.includes("历史灵感"));
    const text = await editor.inputValue();
    assert.match(text, /--- 2026-10-09 ---/); assert.doesNotMatch(text, /2026-10-10/);
    assert.equal(await page.locator("#inspirationBoard textarea").count(), 1);
    assert.equal(await page.locator("#inspirationBoard .inspiration-card").count(), 0);
    await editor.fill(text + "\n新的想法 C");
    await page.evaluate(() => loadRecords({ planningRemote: false }));
    assert.match(await editor.inputValue(), /新的想法 C/);
    await page.waitForFunction(() => window.__mockStore["minimalPomodoroInspirations:2026-10-12"].includes("新的想法 C"));
    await page.evaluate(() => { window.__clock = "2026-10-13T00:01:00+08:00"; refreshNotebookDate(); });
    assert.match(await editor.inputValue(), /--- 2026-10-12 ---\n\n$/);
    await editor.fill((await editor.inputValue()) + "隔天的灵感 D");
    await page.waitForFunction(() => window.__mockStore["minimalPomodoroInspirations:2026-10-13"] === "隔天的灵感 D");
    assert.equal(await page.evaluate(() => window.__mockStore["minimalPomodoroInspirations:2026-10-10"]), "");
    await page.evaluate(() => window.__failSave = true);
    await editor.fill((await editor.inputValue()) + "\n保存失败也不丢失");
    await page.waitForFunction(() => document.querySelector("#inspirationNotebookStatus").dataset.state === "error");
    await page.evaluate(() => loadRecords({ planningRemote: false }));
    assert.match(await editor.inputValue(), /保存失败也不丢失/);
    await page.evaluate(() => window.__failSave = false);
    await editor.press("End"); await editor.press("Space");
    await page.waitForFunction(() => document.querySelector("#inspirationNotebookStatus").dataset.state === "saved");
    await page.screenshot({ path: path.join(root, "test-results/notebook-desktop.png"), fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
    assert.ok((await editor.boundingBox()).y < 844, "The notebook is visible in the first mobile viewport");
    await page.screenshot({ path: path.join(root, "test-results/notebook-mobile.png"), fullPage: true });
    await page.setViewportSize({ width: 1440, height: 980 });
    await page.evaluate(() => setMode("phases"));
    await page.evaluate(() => {
      __notionTests.renderPhaseDatabase([{ id: "test-plan", title: "虚构阶段计划", startDate: "2026-10-09", endDate: "2026-10-18", status: "active", milestones: [{date:"2026-10-12",goal:"两项科研",planningMode:"percentage",targetProgressPercent:null,estimatedMinutes:null,taskProgress:[{taskId:"task:stateweaver",title:"stateweaver",targetProgressPercent:50},{taskId:"task:behavfuzz",title:"behavfuzz",targetProgressPercent:25}]}], url: "https://www.notion.so/test-plan" }]);
    });
    const card = page.locator(".phase-database-card");
    assert.match(await card.textContent(),/stateweaver：累计预期 50%/);
    assert.match(await card.textContent(),/behavfuzz：累计预期 25%/);
    assert.equal(await card.locator("a").count(), 0);
    await card.click({ button: "right" });
    await page.locator("#notionContextMenu button").click();
    assert.equal(await page.evaluate(() => window.__opened.at(-1).url), "https://www.notion.so/test-plan");
    await card.evaluate((node) => node.dataset.notionUrl = "javascript:alert(1)");
    await card.click({ button: "right" });
    assert.equal(await page.locator("#notionContextMenu").evaluate((node) => node.classList.contains("hidden")), true);
    await card.evaluate((node) => node.dataset.notionUrl = "https://www.notion.so/test-plan");
    await card.locator("button").first().focus(); await page.keyboard.press("Shift+F10");
    await page.locator("#notionContextMenu").waitFor({ state: "visible" }); await page.keyboard.press("Escape");
    await page.evaluate(() => { setMode("grid"); fillForm("2026-10-12", "test-record"); });
    assert.equal(await page.locator("#recordRound, #recordCompletion, #recordFocus, #recordInterruption").count(), 0);
    assert.equal(await page.locator("#recordReviewNote").inputValue(), "以前的完成情况");
    await page.locator("#recordReviewNote").fill("新的完成情况");
    await page.locator("#saveRecordBtn").click();
    await page.waitForFunction(() => window.__mockStore["minimalPomodoroTimeline:2026-10-12"][0].reviewNote === "新的完成情况");
    assert.equal(await page.evaluate(() => window.__mockStore["minimalPomodoroTimeline:2026-10-12"][0].round), 9);
    const frame = page.frames().find((f) => f.url().includes("controller.html"));
    await frame.evaluate(async () => {
      window.top.__clock = "2026-10-12T15:00:00+08:00";
      window.top.__mockStore["minimalPomodoroTimeline:2026-10-12"][0].reviewPending = true;
      await openReviewPanel();
    });
    assert.equal(await frame.locator("[data-review-group]").count(), 0);
    await frame.evaluate(async () => {
      document.querySelector("#reviewNote").value = "番茄结束后的完成情况";
      await saveReviewPanel(false);
    });
    await page.waitForFunction(() => window.__mockStore["minimalPomodoroTimeline:2026-10-12"][0].reviewNote === "番茄结束后的完成情况");
    assert.equal(await page.evaluate(() => window.__mockStore["minimalPomodoroTimeline:2026-10-12"][0].completion), "high", "Historical fields are preserved, not replaced by defaults");
    await page.evaluate(async () => {
      currentWeekStart = startOfWeek(new Date());
      await selectTodayDate(new Date());
      setMode("today");
    });
    const todayLife = page.locator('#todayFlowGrid textarea[data-life-date="2026-10-12"]');
    await todayLife.waitFor({ state: "visible" });
    const lifeText = "  昨晚睡了七小时。\n早餐鸡蛋，午饭米饭，晚饭面条。\n心情平静，没有喝甜水。\n";
    await todayLife.fill(lifeText);
    await page.evaluate(() => loadRecords({ planningRemote: false }));
    assert.equal(await todayLife.inputValue(), lifeText, "Refreshing cannot discard an unsaved life draft");
    await page.waitForFunction(() => window.__mockStore["minimalPomodoroLifeRecords:2026-10-12"]?.text.includes("心情平静"));
    assert.equal(await page.evaluate(() => window.__mockStore["minimalPomodoroLifeRecords:2026-10-12"].text), lifeText);
    await page.locator("#historyLifeMode").evaluate((node) => node.click());
    const historyLife = page.locator('#lifeDayList textarea[data-life-date="2026-10-12"]');
    await page.locator('[data-life-card-date="2026-10-12"] [data-life-edit]').click();
    await historyLife.waitFor({ state: "visible" });
    assert.equal(await historyLife.inputValue(), lifeText);
    assert.equal(await page.locator(".life-day-card").count(), 1, "Do not create empty future-day cards");
    await historyLife.fill(lifeText + "补充：晚上散步。");
    await page.waitForFunction(() => window.__mockStore["minimalPomodoroLifeRecords:2026-10-12"]?.text.endsWith("晚上散步。"));
    await page.evaluate(() => DailyLifeRecords.acceptRemote("2026-10-12", { text: "云端旧文", url: "https://www.notion.so/test-life" }));
    assert.match(await historyLife.inputValue(), /晚上散步/);
    await page.evaluate(() => window.__failSave = true);
    await historyLife.fill("保存失败时的生活草稿");
    await page.waitForFunction(() => document.querySelector('#lifeDayList [data-life-status="2026-10-12"]').dataset.state === "error");
    await page.evaluate(() => loadRecords({ planningRemote: false }));
    assert.equal(await historyLife.inputValue(), "保存失败时的生活草稿");
    await page.evaluate(() => window.__failSave = false);
    await historyLife.fill(lifeText);
    await page.waitForFunction(() => window.__mockStore["minimalPomodoroLifeRecords:2026-10-12"].text.endsWith("甜水。\n"));
    await historyLife.fill("");
    await page.waitForFunction(() => window.__mockStore["minimalPomodoroLifeRecords:2026-10-12"].text === "");
    await historyLife.fill(lifeText);
    await page.waitForFunction(() => window.__mockStore["minimalPomodoroLifeRecords:2026-10-12"].text === "  昨晚睡了七小时。\n早餐鸡蛋，午饭米饭，晚饭面条。\n心情平静，没有喝甜水。\n");
    await page.evaluate(() => { window.__clock = "2026-10-13T00:01:00+08:00"; });
    await page.locator("#lifeRecordDate").fill("2026-10-13");
    await page.locator("#openLifeRecordDay").click();
    const nextLife = page.locator('#lifeDayList textarea[data-life-date="2026-10-13"]');
    await nextLife.fill("新一天的心情很好。");
    await page.waitForFunction(() => window.__mockStore["minimalPomodoroLifeRecords:2026-10-13"]?.text === "新一天的心情很好。");
    assert.equal(await historyLife.inputValue(), lifeText, "Midnight does not move the previous day's text");
    await page.screenshot({ path: path.join(root, "test-results/life-desktop.png"), fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
    assert.ok((await page.locator(".life-day-card").first().boundingBox()).y < 844);
    await page.screenshot({ path: path.join(root, "test-results/life-mobile.png"), fullPage: true });
    await page.setViewportSize({ width: 1440, height: 980 });
    await page.locator("#prevWeekBtn").click();
    const oldLife = page.locator('#lifeDayList textarea[data-life-date="2026-10-09"]');
    await page.locator('[data-life-card-date="2026-10-09"] [data-life-edit]').click();
    await oldLife.waitFor({ state: "visible" });
    assert.match(await oldLife.inputValue(), /历史生活记录/);
    await page.evaluate(async () => {
      window.__clock = "2026-10-12T15:00:00+08:00";
      currentWeekStart = startOfWeek(new Date());
      await selectTodayDate(new Date());
      setMode("today");
      await __notionTests.storeLocalTodos("2026-10-12", [{ id: "test-todo", title: "虚构待办", status: "pending", priority: "high", url: "https://www.notion.so/test-todo", estimatedPomodoros: 2, planningMode:"explicit", targetProgressPercent:50, phaseTaskId:"task:stateweaver" }], await MinimalPomodoroNotion.getConfig());
    });
    const todo = page.locator('#todayFlowGrid .flow-todo-item[data-todo-id="test-todo"]');
    assert.match(await todo.textContent(),/累计预期目标 50%/);
    assert.equal(await todo.locator("button").count(), 0, "Todo operations are in the context menu, not on the card");
    const check = todo.locator('input[type="checkbox"]');
    await check.check();
    await page.waitForFunction(() => document.querySelector('#todayFlowGrid .flow-todo-item').dataset.status === "done");
    assert.equal(await check.isChecked(), true);
    await check.uncheck();
    await page.waitForFunction(() => document.querySelector('#todayFlowGrid .flow-todo-item').dataset.status === "pending");
    await page.evaluate(() => window.__failQueue = true);
    await check.check();
    await page.waitForFunction(() => !document.querySelector('#todayFlowGrid .flow-todo-check').disabled);
    assert.equal(await check.isChecked(), false, "A failed status save restores the original checkmark");
    await page.evaluate(() => window.__failQueue = false);
    await todo.click({ button: "right" });
    assert.deepEqual(await page.locator("#notionContextMenu button").allTextContents(), ["开始", "编辑", "删除", "在 Notion 中查看"]);
    await page.locator("#notionContextMenu button").filter({ hasText: /^编辑$/ }).click();
    await page.locator("#notionTodoEditor").waitFor({ state: "visible" });
    assert.equal(await page.locator("#notionTodoTitle").inputValue(), "虚构待办");
    await page.keyboard.press("Escape");
    await todo.focus(); await page.keyboard.press("Shift+F10");
    await page.locator("#notionContextMenu").waitFor({ state: "visible" });
    await page.keyboard.press("Escape");
    await page.screenshot({ path: path.join(root, "test-results/todo-desktop.png"), fullPage: true });
    await frame.evaluate(() => {
      window.MinimalPomodoroController = { ...window.MinimalPomodoroController, startTodoInPip: async (item) => { window.top.__startedTodo = item; return true; } };
    });
    await todo.click({ button: "right" });
    await page.locator("#notionContextMenu button").filter({ hasText: /^开始$/ }).click();
    await page.waitForFunction(() => window.__startedTodo?.title === "虚构待办");
    assert.equal(await page.evaluate(() => window.__startedTodo.date), "2026-10-12");
    page.once("dialog", (dialog) => dialog.accept());
    await todo.click({ button: "right" });
    await page.locator("#notionContextMenu button").filter({ hasText: /^删除$/ }).click();
    await page.waitForFunction(() => !document.querySelector('#todayFlowGrid .flow-todo-item[data-todo-id="test-todo"]'));
    await page.evaluate(() => sessionStorage.setItem("__persistedMockStore", JSON.stringify(window.__mockStore)));
    await page.reload();
    await page.evaluate(() => setMode("life"));
    await page.locator('[data-life-card-date="2026-10-12"] [data-life-edit]').click();
    await historyLife.waitFor({ state: "visible" });
    await page.waitForFunction(() => document.querySelector('#lifeDayList textarea[data-life-date="2026-10-12"]')?.value.includes("心情平静"));
    assert.equal(await historyLife.inputValue(), lifeText, "Life records survive reopening");
    assert.deepEqual(errors, []);
    console.log("Browser UI: desktop/mobile, notebooks, daily life drafts/save/failure/midnight/history/reopen, todo checkbox/undo/failure/menu/keyboard, Notion URL safety and record reviews passed (synthetic local data only)");
    await context.close();
  } finally { await browser.close(); }
})().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => server.close());
