const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
const { chromium } = require("playwright");
const root = path.resolve(__dirname, "..");
const out = path.join(root, "test-results/redesign");
fs.mkdirSync(out, { recursive: true });
const server = http.createServer((req, res) => {
  const name = new URL(req.url, "http://localhost").pathname;
  const file = path.resolve(root, `.${name}`);
  if (!file.startsWith(root + path.sep) || !/\.(html|css|js|png)$/.test(file) || !fs.existsSync(file)) { res.writeHead(404); res.end(); return; }
  let content = fs.readFileSync(file);
  if (name === "/notion-integration.js") content = content.toString().replace("  function escapeNotionHtml(value)",
    "  globalThis.__designTests = { phases(plans) { allPhasePlans = plans; renderPhaseDatabase(plans); }, renderWeeklyPlan, renderFlowTodos, renderFlowReview };\n  function escapeNotionHtml(value)");
  res.setHeader("Content-Type", ({ ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".png": "image/png" })[path.extname(file)]);
  res.end(content);
});

function installMock() {
  const host = window.top;
  if (!host.__designStore) {
    host.__designStore = {};
    const day = "2026-10-12", stamp = (time) => Date.parse(`${day}T${time}:00+08:00`);
    host.__designStore[`minimalPomodoroTimeline:${day}`] = [
      { id: "r1", type: "work", content: "BehavFuzz：现有方案与协议入口调研", start: stamp("09:00"), end: stamp("10:15"), completedNaturally: true, reviewNote: "整理协议入口与现有方案，明确了后续调研方向。" },
      { id: "r2", type: "break", content: "散步休息", start: stamp("10:15"), end: stamp("10:30") },
      { id: "r3", type: "work", content: "运行环境与日志样本梳理", start: stamp("10:30"), end: stamp("11:30"), completedNaturally: true },
      { id: "r4", type: "life", content: "午餐", start: stamp("12:00"), end: stamp("12:45") },
      { id: "r5", type: "work", content: "Agent 学习或论文阅读：阅读并整理笔记", start: stamp("13:30"), end: stamp("14:45"), completedNaturally: true },
    ];
    host.__designStore["minimalPomodoroInspirations:2026-10-09"] = "把协议入口整理成可复用的测试清单。";
    host.__designStore["minimalPomodoroInspirations:2026-10-12"] = "阅读论文时，把疑问与下一步实验写在一起。\n考虑用日志中的状态变化构建协议模型。";
    for (const key of ["2026-10-09", "2026-10-12"]) host.__designStore[`minimalPomodoroLifeRecords:${key}`] = { schemaVersion: 1, date: key, text: "昨晚睡了七小时，起床状态不错。\n早餐鸡蛋和牛奶，午餐米饭。\n下午散步二十分钟，心情平静。\n没有喝甜水。", pendingSync: false };
    host.__listeners = [];
  }
  const NativeDate = Date;
  window.Date = class extends NativeDate {
    constructor(...args) { super(...(args.length ? args : ["2026-10-12T15:00:00+08:00"])); }
    static now() { return NativeDate.parse("2026-10-12T15:00:00+08:00"); }
  };
  window.chrome = {
    storage: { local: {
      get: async (keys) => keys == null ? structuredClone(host.__designStore) : Object.fromEntries((typeof keys === "string" ? [keys] : Array.isArray(keys) ? keys : Object.keys(keys)).map((key) => [key, host.__designStore[key] ?? (typeof keys === "object" && !Array.isArray(keys) ? keys[key] : undefined)])),
      set: async (values) => { const changes = Object.fromEntries(Object.entries(values).map(([key, value]) => [key, { newValue: value }])); Object.assign(host.__designStore, structuredClone(values)); for (const fn of host.__listeners) fn(changes, "local"); },
      remove: async (keys) => { for (const key of Array.isArray(keys) ? keys : [keys]) delete host.__designStore[key]; },
    }, onChanged: { addListener: (fn) => host.__listeners.push(fn) } },
    runtime: { getURL: (file) => location.origin + "/" + file, sendMessage: async () => ({ ok: true }), onMessage: { addListener() {} } },
    tabs: { create: async () => ({}) }, idle: { onStateChanged: { addListener() {} }, setDetectionInterval() {} },
  };
}

(async () => {
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const url = `http://127.0.0.1:${server.address().port}`;
  const executablePath = process.env.BROWSER_EXECUTABLE || ["C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", "C:/Program Files/Google/Chrome/Application/chrome.exe"].find(fs.existsSync);
  const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
  try {
    const context = await browser.newContext({ viewport: { width: 1536, height: 1024 }, timezoneId: "Asia/Shanghai" });
    await context.addInitScript(installMock);
    const page = await context.newPage(), errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(url + "/timeline.html?mode=today");
    await page.locator(".timer-brand").count();
    await page.waitForFunction(() => document.querySelector("#todayTimelineGrid .record"));
    const plans = [
      { id: "plan-a", title: "协议状态机与开题报告编写", startDate: "2026-10-12", endDate: "2026-10-18", status: "active", description: "推进协议状态机研究，完成开题报告初稿。", constraints: "上午调研，下午优先撰写报告。", milestones: [{ date: "2026-10-12", goal: "整理现有方案与协议入口", estimatedMinutes: 180 }], url: "https://www.notion.so/example" },
      { id: "plan-b", title: "双主线科研七日推进", startDate: "2026-10-05", endDate: "2026-10-11", status: "completed", description: "完成论文阅读和实验环境搭建。", finalSummary: "主要成果\n完成协议入口调研，整理日志样本。\n\n计划偏差\n实验环境耗时超出预期。\n\n下一步\n补齐验证实验，集中编写报告。", milestones: [{ date: "2026-10-05", goal: "搭建运行环境", estimatedMinutes: 120 }] },
    ];
    const todos = [
      { id: "todo-a", title: "BehavFuzz：现有方案与协议入口调研", status: "done", priority: "high", estimatedPomodoros: 3, plannedStart: "2026-10-12T09:00:00+08:00", plannedEnd: "2026-10-12T10:30:00+08:00" },
      { id: "todo-b", title: "运行环境与日志样本梳理", status: "pending", priority: "medium", estimatedPomodoros: 2 },
    ];
    plans[0].milestones[0].taskEstimates = [
      { title: "BehavFuzz：现有方案与协议入口调研", estimatedMinutes: 75, deliverable: "协议入口调研纪要" },
      { title: "Agent 学习或论文阅读：阅读并整理笔记", estimatedMinutes: 60, deliverable: "阅读笔记" },
    ];
    plans[0].milestones[0].deliverables = ["测试清单", "阅读疑问与后续实验"];
    plans[0].milestones[0].notes = "上午推进调研，下午整理笔记；保留实验问题与后续验证计划。";
    async function capture(name) {
      await page.mouse.move(0, 0);
      await page.waitForTimeout(180);
      await page.screenshot({ path: path.join(out, name + ".png"), fullPage: true });
    }
    async function noPageOverflow() { assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), "Page must not scroll horizontally"); }
    await page.evaluate((todos) => __designTests.renderFlowTodos("2026-10-12", todos), todos);
    await capture("today-dark");
    for (const theme of ["light", "dark"]) {
      await page.locator(`.sidebar-footer [data-theme-choice="${theme}"]`).click();
      await page.waitForFunction((value) => document.documentElement.dataset.theme === value, theme);
      assert.equal(await page.evaluate(() => window.__designStore.personalSystemTheme), theme);
      assert.equal(await page.locator(".app-sidebar .app-brand strong").textContent(), "个人系统");
      assert.equal(await page.locator(".brand-mark svg").count() > 0, true);
      for (const mode of ["today", "grid", "text", "inspiration", "life", "summary", "notion"]) {
        await page.evaluate((mode) => setMode(mode), mode);
        assert.equal(await page.locator(".app-sidebar .seg.active").count(), 1, "Exactly one main page is selected");
        assert.equal(await page.locator("#summaryView").isVisible(), mode === "summary", "Statistics cannot leak into other pages");
        if (mode === "today") {
          await page.evaluate((plan) => __designTests.renderWeeklyPlan(plan), plans[0]);
          await page.locator(".today-phase-details > summary").click();
          const phase = page.locator("#todayPhasePlanDock .notion-weekly-plan-card");
          const styles = await phase.evaluate((node) => {
            const card = getComputedStyle(node), primary = getComputedStyle(node.querySelector(".phase-plan-primary"));
            const todo = getComputedStyle(document.querySelector("#todayFlowGrid .flow-todo-item"));
            return { sameSurface: card.backgroundColor === todo.backgroundColor, border: todo.borderTopWidth, radius: todo.borderRadius, nestedBackground: primary.backgroundColor, nestedBorder: primary.borderTopWidth };
          });
          assert.deepEqual(styles, { sameSurface: true, border: "1px", radius: "8px", nestedBackground: "rgba(0, 0, 0, 0)", nestedBorder: "0px" });
          assert.equal(await phase.locator(".phase-plan-full-details .phase-milestone-content").isVisible(), false);
          await phase.screenshot({ path: path.join(out, `today-phase-${theme}.png`) });
          await phase.locator(".phase-plan-full-details > summary").click();
          assert.equal(await phase.locator(".phase-plan-full-details .phase-milestone-content").isVisible(), true);
          await phase.locator(".phase-plan-full-details > summary").click();
          await page.locator(".today-phase-details > summary").click();
        }
        if (mode === "text") {
          await page.evaluate(() => {
            document.querySelector('#weekFlowGrid [data-flow-date="2026-10-12"]').click();
          });
          assert.equal(await page.locator("#weekFlowGrid .flow-day-card:visible").count(), 1);
          await page.locator('#flowDateTabs button[data-date="2026-10-13"]').click();
          assert.equal(await page.locator("#weekFlowGrid .flow-day-card:visible").getAttribute("data-flow-date"), "2026-10-13");
          await page.locator('#flowDateTabs button[data-date="2026-10-12"]').click();
        }
        if (mode === "grid") assert.ok(await page.locator("#timelineGrid").evaluate((node) => node.scrollWidth <= node.parentElement.clientWidth + 1), "All seven days fit desktop");
        if (mode === "grid") assert.equal(await page.locator(".history-view-switch").evaluate((node) => getComputedStyle(node).display), "flex");
        await noPageOverflow(); await capture(`${mode}-${theme}`);
      }
      for (const tab of ["model", "automation", "profile", "connection"]) {
        await page.locator(`[data-settings-tab="${tab}"]`).click();
        await capture(`settings-${tab}-${theme}`);
      }
      await page.evaluate(() => setMode("phases"));
      await page.evaluate((plans) => __designTests.phases(plans), plans);
      const card = page.locator(".phase-database-card").last();
      const before = await card.boundingBox();
      await card.locator("[data-phase-db-detail]").click();
      assert.equal(await page.locator("#phaseDrawer").evaluate((node) => node.open), true);
      assert.equal((await card.boundingBox()).width, before.width);
      if (theme === "dark") {
        await page.locator(".phase-drawer-close").click();
        await page.locator(".phase-database-card").first().locator("[data-phase-db-detail]").click();
        await page.locator("#phaseDrawer .phase-database-detail").click({ button: "right" });
        assert.equal(await page.locator("#notionContextMenu").evaluate((node) => node.closest("dialog")?.id), "phaseDrawer");
        await page.keyboard.press("Escape");
      }
      await capture(`phase-details-${theme}`);
      await page.keyboard.press("Escape");
      assert.equal(await page.locator("#phaseDrawer").evaluate((node) => node.open), false);
      await capture(`phases-${theme}`);
    }
    await page.evaluate(() => setMode("grid"));
    assert.equal(await page.locator("#timelineGrid .day-track:visible").count(), 7);
    assert.equal(await page.locator("#timelineGrid .todo-plan-track:visible").count(), 0);
    await page.locator('[data-calendar-scope="day"]').click();
    assert.equal(await page.locator("#timelineGrid .day-col:visible").count(), 1);
    await page.locator('[data-calendar-date="2026-10-13"]').click();
    assert.equal(await page.locator("#timelineGrid .day-col:visible").getAttribute("data-date-key"), "2026-10-13");
    await page.locator('[data-calendar-date="2026-10-12"]').click();
    await page.evaluate((todos) => { gridTodosByDate.set("2026-10-12", todos); renderGrid(); }, todos);
    await page.locator('#gridView [data-calendar-lane="planned"]').click();
    assert.equal(await page.locator("#timelineGrid .day-track:visible").count(), 0);
    assert.equal(await page.locator("#timelineGrid .planned-todo-block:visible").count(), 1);
    await capture("calendar-day-planned");
    await page.locator('#gridView [data-calendar-lane="actual"]').click();
    await capture("calendar-day-actual");
    await page.locator('[data-calendar-scope="week"]').click();
    await page.evaluate(() => calendarScopeChosen = false);
    await page.evaluate(() => setMode("today"));
    assert.equal(await page.locator("#todayFlowGrid .flow-fold[open]").count(), 0);
    const completionFold = page.locator("#todayFlowGrid .flow-completion-section details");
    await completionFold.locator("summary").click();
    await page.locator('#todayFlowGrid [data-flow-role="completion"]').fill("手动草稿\n原格式保留");
    await completionFold.locator("summary").click();
    await completionFold.locator("summary").click();
    assert.equal(await page.locator('#todayFlowGrid [data-flow-role="completion"]').inputValue(), "手动草稿\n原格式保留");
    await completionFold.locator("summary").click();
    await page.evaluate(() => setMode("inspiration"));
    const notebookOriginal = await page.locator("#inspirationNotebook").inputValue();
    await page.locator('[data-notebook-mode="read"]').click();
    assert.equal(await page.locator("#inspirationNotebook").isVisible(), false);
    assert.equal(await page.locator(".notebook-date time").textContent(), "2026-10-09");
    await capture("inspiration-reading");
    await page.locator('[data-notebook-mode="write"]').click();
    assert.equal(await page.locator("#inspirationNotebook").inputValue(), notebookOriginal);
    await page.evaluate(() => setMode("life"));
    const lifeCard = page.locator('[data-life-card-date="2026-10-12"]');
    assert.equal(await lifeCard.locator("textarea").isVisible(), false);
    const lifeText = await lifeCard.locator(".life-day-text").textContent();
    await lifeCard.locator("[data-life-edit]").click();
    assert.equal(await lifeCard.locator("textarea").inputValue(), lifeText);
    await lifeCard.locator("[data-life-done]").click();
    assert.equal(await lifeCard.locator("textarea").isVisible(), false);
    assert.equal(await lifeCard.locator(".life-day-text").textContent(), lifeText);
    await page.evaluate(() => setMode("summary"));
    assert.equal(await page.locator("#summary .stat").count(), 4);
    assert.equal(await page.locator(".summary-sidebar-content").isVisible(), false);
    await page.locator("#summaryCollapseBtn").click();
    assert.doesNotMatch(await page.locator("#summaryView").textContent(), /完成度|专注度|打断 无/);
    await page.locator("#summaryCollapseBtn").click();
    await page.evaluate(() => setMode("phases"));
    await page.evaluate((plans) => __designTests.phases(plans), plans);
    const completePlan = page.locator('[data-phase-state="completed"]');
    await completePlan.locator(".inline-menu > summary").click();
    assert.equal(await completePlan.locator("[data-phase-db-delete]").isVisible(), true);
    await page.keyboard.press("Escape");
    assert.equal(await completePlan.locator("[data-phase-db-delete]").isVisible(), false);
    await completePlan.locator("[data-phase-db-detail]").click();
    assert.equal(await page.locator("#phaseDrawer .phase-final-summary h4").count(), 3);
    await page.keyboard.press("Escape");
    await page.evaluate(() => setMode("notion"));
    await page.locator('[data-settings-tab="profile"]').click();
    await page.evaluate(() => {
      document.querySelector("#notionWorkWindows").value = "1/2/3/4/5 09:00-12:00 深度工作, 1-5 14:00-18:00";
      PersonalSystemWorkspace.refreshScheduleEditors();
    });
    const work = page.locator(".schedule-field").filter({ has: page.locator("#notionWorkWindows") });
    assert.equal(await work.locator(".schedule-row").count(), 2);
    await work.locator(".schedule-row").first().locator("input").nth(1).fill("09:30");
    assert.equal(await page.locator("#notionWorkWindows").inputValue(), "1/2/3/4/5 09:30-12:00 深度工作, 1-5 14:00-18:00");
    await work.locator(".schedule-row").first().locator('[data-weekday="0"]').click();
    assert.equal(await page.locator("#notionWorkWindows").inputValue(), "1/2/3/4/5/0 09:30-12:00 深度工作, 1-5 14:00-18:00");
    await capture("settings-weekdays");
    await page.evaluate(() => { document.querySelector("#notionRoutineBlocks").value = "不可识别的原文"; PersonalSystemWorkspace.refreshScheduleEditors(); });
    const invalidSchedule = page.locator(".schedule-field").filter({ has: page.locator("#notionRoutineBlocks") });
    assert.equal(await invalidSchedule.locator("details").evaluate((node) => node.open), true);
    assert.equal(await invalidSchedule.locator(".schedule-add").isDisabled(), true);
    assert.equal(await page.locator("#notionRoutineBlocks").inputValue(), "不可识别的原文");
    await page.evaluate(() => { document.querySelector("#notionRoutineBlocks").value = ""; PersonalSystemWorkspace.refreshScheduleEditors(); });
    assert.equal(await page.locator("#notionLlmModel").evaluate((input) => input.form.id), "notionSettingsForm");
    assert.equal(await page.locator("#notionDailyReviewTime").evaluate((input) => input.form.id), "notionSettingsForm");
    assert.equal(await page.locator("#notionWorkWindows").evaluate((input) => input.form.id), "notionProfileForm");
    await page.locator('[data-settings-tab="automation"]').focus();
    await page.keyboard.press("ArrowRight");
    assert.equal(await page.locator('[data-settings-tab="profile"]').getAttribute("aria-selected"), "true");
    const frame = page.frames().find((frame) => frame.url().includes("controller.html"));
    await frame.waitForSelector(".timer-brand", { state: "attached" });
    assert.equal(await frame.locator(".timer-brand strong").textContent(), "个人系统");
    await page.evaluate(() => PersonalSystemUI.setTheme("light"));
    await frame.waitForFunction(() => document.documentElement.dataset.theme === "light");
    await page.evaluate(() => PersonalSystemUI.setTheme("dark"));
    await frame.waitForFunction(() => document.documentElement.dataset.theme === "dark");
    for (const width of [390, 768, 1024]) {
      await page.setViewportSize({ width, height: 844 });
      for (const mode of ["today", "grid", "text", "inspiration", "life", "summary", "notion", "phases"]) {
        await page.evaluate((mode) => setMode(mode), mode);
        await noPageOverflow();
        if (mode === "grid" && width <= 900) assert.equal(await page.locator("#timelineGrid .day-col:visible").count(), 1, "Narrow calendars default to a readable single day");
        if (mode === "today" && width === 390) {
          await page.evaluate((plan) => __designTests.renderWeeklyPlan(plan), plans[0]);
          await page.locator(".today-phase-details > summary").click();
          await noPageOverflow();
          await page.locator("#todayPhasePlanDock .notion-weekly-plan-card").screenshot({ path: path.join(out, "today-phase-mobile.png") });
          await page.locator(".today-phase-details > summary").click();
        }
        if (mode === "summary") assert.ok(await page.locator(".chart-bar-svg").evaluate((svg) => Math.abs(svg.viewBox.baseVal.width - svg.parentElement.clientWidth) <= 1), "Chart labels retain their size at narrow widths");
        if (width === 390) await capture(`${mode}-mobile`);
      }
    }
    await page.setViewportSize({ width: 1536, height: 1024 });
    await page.evaluate(() => { setMode("grid"); fillForm("2026-10-12", "r1"); });
    await capture("record-editor");
    await page.locator('[data-time-picker-for="recordStart"]').click();
    await page.locator("#customTimePicker").waitFor({ state: "visible" });
    assert.ok(await page.locator("#customTimePicker").evaluate((picker) => {
      const rect = picker.getBoundingClientRect();
      return picker.contains(document.elementFromPoint(rect.left + rect.width / 2, rect.top + 20));
    }), "Time picker is above the editor overlay");
    await page.locator('#customTimePicker button[data-time-hour="10"]').click();
    assert.equal(await page.locator("#recordStart").inputValue(), "10:00");
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("Enter");
    assert.equal(await page.locator("#recordStart").inputValue(), "11:00");
    await page.locator('#customTimePicker button[data-time-hour="10"]').click();
    await capture("time-picker");
    await page.keyboard.press("Escape");
    await page.locator("#closeRecordEditorBtn").click();
    const timer = await context.newPage();
    timer.on("pageerror", (error) => errors.push(error.message));
    await timer.goto(url + "/controller.html?main=1");
    await timer.locator(".timer-brand").waitFor();
    for (const size of [{ width: 580, height: 420 }, { width: 390, height: 270 }, { width: 320, height: 180 }]) {
      await timer.setViewportSize(size);
      await timer.waitForTimeout(100);
      const geometry = await timer.evaluate(() => {
        const time = document.querySelector(".time").getBoundingClientRect(), box = document.querySelector(".time-wrap").getBoundingClientRect(), controls = document.querySelector(".controls").getBoundingClientRect();
        return { fits: time.left >= box.left - 1 && time.right <= box.right + 1 && time.top >= box.top - 1 && time.bottom <= box.bottom + 1, overlaps: time.bottom > controls.top };
      });
      assert.ok(geometry.fits && !geometry.overlaps, `Timer fits ${size.width}x${size.height}`);
      await timer.screenshot({ path: path.join(out, `timer-${size.width}.png`) });
      assert.equal(await timer.locator(".bar-row > button:visible").count(), 3);
      await timer.locator("#timerMore > summary").click();
      assert.equal(await timer.locator("#timerMore").evaluate((node) => node.open), true);
      await timer.locator("#settingsBtn").scrollIntoViewIfNeeded();
      const hit = await timer.locator("#settingsBtn").evaluate((node) => { const box = node.getBoundingClientRect(); return node.contains(document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2)); });
      assert.equal(hit, true, "Timer menu is not clipped or covered");
      await timer.keyboard.press("Escape");
      assert.equal(await timer.locator("#timerMore").evaluate((node) => node.open), false);
    }
    await timer.setViewportSize({ width: 580, height: 520 });
    await timer.locator("#timerMore > summary").click();
    await timer.locator("#settingsBtn").click();
    await timer.waitForFunction(() => document.querySelector("#surface").classList.contains("settings-open"));
    await timer.waitForTimeout(200);
    await timer.screenshot({ path: path.join(out, "timer-settings.png") });
    await timer.locator('[data-timer-tab="sites"]').click();
    assert.equal(await timer.locator("#blacklistInput").isVisible(), true);
    assert.equal(await timer.locator("#singleWorkInput").isVisible(), false);
    await timer.screenshot({ path: path.join(out, "timer-settings-sites.png") });
    await timer.locator('[data-timer-tab="feedback"]').click();
    assert.equal(await timer.locator("#volumeInput").isVisible(), true);
    await timer.screenshot({ path: path.join(out, "timer-settings-feedback.png") });
    await timer.locator("#closeSettings").click();
    await timer.waitForFunction(() => !document.querySelector("#surface").classList.contains("settings-open"));
    await timer.waitForTimeout(200);
    await timer.evaluate(() => { pip.surface.classList.add("review-open"); pip.reviewRecordMeta.textContent = "09:00–09:25 · 整理协议资料"; pip.reviewNote.value = "看完协议入口资料，整理了三条待验证的问题。"; });
    await timer.screenshot({ path: path.join(out, "timer-review.png") });
    const blocked = await context.newPage();
    blocked.on("pageerror", (error) => errors.push(error.message));
    await blocked.goto(url + "/blocked.html?site=example.com");
    await blocked.screenshot({ path: path.join(out, "blocked-dark.png"), fullPage: true });
    await blocked.locator('[data-theme-choice="light"]').click();
    await blocked.screenshot({ path: path.join(out, "blocked-light.png"), fullPage: true });
    await blocked.setViewportSize({ width: 390, height: 844 });
    assert.ok(await blocked.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
    assert.deepEqual(errors, []);
    console.log("Design UI: 8 views at desktop/mobile/tablet, both persistent themes, day selection, stable phase drawer, configuration ownership/tabs, schedule editing, timer geometry and blocked page passed (synthetic local data only)");
    await context.close();
  } finally { await browser.close(); }
})().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => server.close());
