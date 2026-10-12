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
    "  globalThis.__notionTests = { renderPhaseDatabase, renderFlowTodos, renderFlowReview, renderTodos, renderWeeklyPlan };\n  function escapeNotionHtml(value)");
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
        host.__mockStore = {
          "minimalPomodoroInspirations:2026-10-09": "历史灵感 A\n第二行",
          "minimalPomodoroInspirations:2026-10-10": "",
          "minimalPomodoroInspirations:2026-10-12": "今天的灵感 B",
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
              if (host.__failSave && Object.keys(values).some((key) => key.startsWith("minimalPomodoroInspirations:"))) throw new Error("虚构保存失败");
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
      __notionTests.renderPhaseDatabase([{ id: "test-plan", title: "虚构阶段计划", startDate: "2026-10-09", endDate: "2026-10-18", status: "active", milestones: [], url: "https://www.notion.so/test-plan" }]);
    });
    const card = page.locator(".phase-database-card");
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
    assert.deepEqual(errors, []);
    console.log("Browser UI: desktop/mobile, notebook save/refresh/failure/midnight, Notion menu/keyboard/URL safety, record and Pomodoro completion passed (synthetic local data only)");
    await context.close();
  } finally { await browser.close(); }
})().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => server.close());
