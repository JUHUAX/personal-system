(function () {
  "use strict";
  const byId = (id) => document.getElementById(id);
  const scheduleEditors = new Map();
  let drawer;
  let drawerOrigin;
  let selectedDate = "";
  const foldStates = new Map();

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  function decorateButtons(root) {
    const icons = {
      refreshBtn: "refresh-cw", closeRecordEditorBtn: "x", closeSupplementRecordsBtn: "x",
      notionTodoEditorClose: "x", customTimePickerClose: "x", saveRecordBtn: "save",
      startRecordPomodoroBtn: "play", deleteEditingBtn: "trash-2", phasePlansCreate: "plus",
      notionSyncWeek: "refresh-cw", notionSyncAll: "refresh-cw", notionTestConnection: "link",
      notionInitializeWorkspace: "database", openLifeRecordDay: "plus", addTimelineTypeBtn: "plus",
    };
    const actions = { "new-todo": "plus", "sync-day": "refresh-cw", "generate-todos": "sparkles", "adjust-todos": "list-restart", "save-completion": "save", "generate-review": "sparkles", "update-archive": "archive", "export-day-md": "download", edit: "pencil", copy: "copy", delete: "trash-2", "start-pomodoro": "play" };
    const buttons = [...root.querySelectorAll("button")];
    if (root.matches?.("button")) buttons.unshift(root);
    for (const button of buttons) {
      const icon = icons[button.id] || actions[button.dataset.flowAction || button.dataset.action];
      if (icon) button.dataset.icon = icon;
      if (["closeRecordEditorBtn", "closeSupplementRecordsBtn", "notionTodoEditorClose", "customTimePickerClose"].includes(button.id)) {
        if (!button.dataset.iconOnly) {
          button.setAttribute("aria-label", "关闭");
          button.title = "关闭";
          button.textContent = "";
          button.dataset.iconOnly = "true";
        }
      }
    }
    PersonalSystemUI.decorate(root);
  }

  function updateFlowTabs(date) {
    const cards = [...byId("weekFlowGrid").querySelectorAll("[data-flow-date]")];
    if (!cards.length) return;
    selectedDate = cards.some((card) => card.dataset.flowDate === date) ? date : cards[0].dataset.flowDate;
    const tabs = byId("flowDateTabs");
    const keys = cards.map((card) => card.dataset.flowDate);
    if (tabs.dataset.keys !== keys.join("|")) {
      tabs.replaceChildren();
      tabs.dataset.keys = keys.join("|");
      for (const card of cards) {
        const key = card.dataset.flowDate;
        const day = new Date(`${key}T12:00:00`);
        const button = element("button");
        button.type = "button";
        button.dataset.date = key;
        button.append(element("span", "", day.toLocaleDateString("zh-CN", { weekday: "short" })), element("strong", "", `${day.getMonth() + 1}/${day.getDate()}`));
        button.setAttribute("aria-label", key);
        button.onclick = () => card.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        tabs.append(button);
      }
    }
    for (const button of tabs.children) button.setAttribute("aria-pressed", String(button.dataset.date === selectedDate));
  }

  function showPhaseDetails(card, plan) {
    drawerOrigin = card.querySelector("[data-phase-db-detail]");
    byId("phaseDrawerTitle").textContent = plan.title || "阶段计划";
    byId("phaseDrawerDates").textContent = `${plan.startDate} — ${plan.endDate}`;
    const copy = card.querySelector(".phase-database-detail").cloneNode(true);
    copy.classList.remove("hidden");
    copy.dataset.notionUrl = plan.url || "";
    byId("phaseDrawerContent").replaceChildren(copy);
    if (!drawer.open) drawer.showModal();
  }

  function initDrawer() {
    drawer = element("dialog", "phase-drawer");
    drawer.id = "phaseDrawer";
    drawer.setAttribute("aria-labelledby", "phaseDrawerTitle");
    drawer.innerHTML = '<header><div><h2 id="phaseDrawerTitle"></h2><p id="phaseDrawerDates"></p></div><button class="phase-drawer-close" type="button" data-icon="x" aria-label="关闭详情" title="关闭详情"></button></header><div id="phaseDrawerContent"></div>';
    document.body.append(drawer);
    drawer.querySelector("button").onclick = () => drawer.close();
    drawer.addEventListener("click", (event) => {
      const rect = drawer.getBoundingClientRect();
      if (event.target === drawer && (event.clientX < rect.left || event.clientX > rect.right)) drawer.close();
    });
    drawer.addEventListener("close", () => drawerOrigin?.focus({ preventScroll: true }));
  }

  function initSettings() {
    const settings = byId("notionSettingsForm");
    const view = byId("notionView");
    const connection = element("section", "connection-columns");
    const notion = element("div", "connection-notion");
    const model = element("div", "connection-model");
    const automation = element("section", "settings-automation");
    connection.id = "settingsConnection";
    automation.id = "settingsAutomation";
    const header = settings.querySelector(":scope > .notion-card-head");
    header.querySelector("h3").textContent = "Notion";
    const token = byId("notionToken").closest("label");
    const setup = settings.querySelector(".notion-setup-box");
    const sources = byId("notionTimeRecordSource").closest(".notion-form-grid");
    const dailyTime = byId("notionDailyReviewTime").closest("label");
    sources.classList.add("data-source-fields");
    const names = ["时间记录", "阶段计划", "个人节奏", "每日待办", "每日复盘", "每日归档"];
    [...sources.querySelectorAll("label")].slice(0, 6).forEach((label, index) => label.querySelector("span").textContent = names[index]);
    automation.append(element("h3", "", "自动化"), settings.querySelector(".notion-toggle-grid"), byId("notionSyncIntervalField"), dailyTime);
    notion.append(header, token, setup);
    model.id = "settingsModel";
    model.append(settings.querySelector(".notion-llm-box"));
    const appearance = element("section", "appearance-section");
    appearance.innerHTML = '<h3>外观</h3><div class="theme-switch" role="group" aria-label="外观主题"><button type="button" data-theme-choice="light" data-icon="sun" aria-label="浅色主题" title="浅色主题"></button><button type="button" data-theme-choice="dark" data-icon="moon" aria-label="深色主题" title="深色主题"></button></div>';
    model.append(appearance);
    const advanced = element("details", "settings-advanced");
    advanced.append(element("summary", "", "高级数据源"), sources);
    notion.append(advanced);
    connection.append(notion);
    const actions = settings.querySelector(":scope > .notion-actions");
    actions.classList.add("settings-actions");
    settings.prepend(connection, model, automation);
    const sync = byId("notionSyncWeek").closest(".notion-card");
    sync.classList.add("settings-sync");
    notion.append(sync);
    const profile = byId("notionProfileForm").closest(".notion-card");
    profile.id = "settingsProfile";
    profile.classList.add("settings-profile");
    byId("notionView").append(profile);
    const tabs = element("div", "settings-tabs");
    tabs.setAttribute("role", "tablist");
    tabs.setAttribute("aria-label", "配置分类");
    const panels = { connection, model, automation, profile };
    function selectTab(name) {
      for (const [key, panel] of Object.entries(panels)) panel.hidden = key !== name;
      settings.hidden = name === "profile";
      for (const button of tabs.children) {
        const active = button.dataset.settingsTab === name;
        button.setAttribute("aria-selected", String(active));
        button.tabIndex = active ? 0 : -1;
      }
      if (name === "profile") refreshScheduleEditors();
    }
    for (const [key, label] of [["connection", "Notion"], ["model", "模型与外观"], ["automation", "自动化"], ["profile", "个人节奏"]]) {
      const button = element("button", "", label);
      button.type = "button";
      button.id = `settingsTab-${key}`;
      button.dataset.settingsTab = key;
      button.setAttribute("role", "tab");
      button.setAttribute("aria-controls", panels[key].id);
      button.onclick = () => selectTab(key);
      panels[key].setAttribute("role", "tabpanel");
      panels[key].setAttribute("aria-labelledby", button.id);
      tabs.append(button);
    }
    tabs.addEventListener("keydown", (event) => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      const buttons = [...tabs.children], index = buttons.indexOf(document.activeElement);
      const next = event.key === "Home" ? 0 : event.key === "End" ? buttons.length - 1 : (index + (event.key === "ArrowRight" ? 1 : -1) + buttons.length) % buttons.length;
      selectTab(buttons[next].dataset.settingsTab);
      buttons[next].focus();
    });
    settings.addEventListener("invalid", (event) => selectTab(event.target.closest("#settingsAutomation") ? "automation" : event.target.closest("#settingsModel") ? "model" : "connection"), true);
    view.prepend(tabs);
    byId("sidebarConnection").append(byId("notionConnectionState"));
    selectTab("connection");
    PersonalSystemUI.setTheme(PersonalSystemUI.getTheme(), false);
  }

  function initScheduleEditor(id, dated = false) {
    const source = byId(id);
    const label = source.closest("label");
    const field = element("div", "notion-field schedule-field");
    label.replaceWith(field);
    field.append(label);
    const table = element("div", "schedule-table");
    const raw = element("details");
    raw.append(element("summary", "", "原始时间安排"), source);
    const add = element("button", "schedule-add", "添加安排");
    add.type = "button"; add.dataset.icon = "plus";
    label.append(table, add, raw);
    let displayed = null;
    function write() {
      source.value = [...table.children].map((row) => {
        const inputs = [...row.querySelectorAll("input")].map((input) => input.value.trim());
        return `${inputs[0]} ${inputs[1]}-${inputs[2]}${inputs[3] ? ` ${inputs[3]}` : ""}`;
      }).join(", ");
      displayed = source.value;
      source.dispatchEvent(new Event("change", { bubbles: true }));
    }
    function addRow(values = [dated ? new Date().toLocaleDateString("en-CA") : "1-5", "09:00", "12:00", ""]) {
      const row = element("div", "schedule-row");
      const labels = [dated ? "日期" : "星期", "开始时间", "结束时间", "安排内容"];
      values.forEach((value, index) => {
        const input = element("input");
        input.type = index === 0 && dated ? "date" : index === 1 || index === 2 ? "time" : "text";
        input.value = value;
        input.placeholder = labels[index];
        input.setAttribute("aria-label", `${label.querySelector("span").textContent} ${labels[index]}`);
        input.addEventListener("input", write);
        row.append(input);
      });
      if (!dated) {
        const sourceDays = row.querySelector("input");
        sourceDays.type = "hidden";
        const days = new Set();
        for (const chunk of values[0].split("/")) {
          const range = chunk.match(/^([0-6])-([0-6])$/);
          if (range) for (let day = Number(range[1]); day <= Number(range[2]); day++) days.add(day);
          else if (/^[0-6]$/.test(chunk)) days.add(Number(chunk));
        }
        const choices = element("div", "weekday-choices");
        choices.setAttribute("role", "group"); choices.setAttribute("aria-label", "重复星期");
        for (const [day, name] of [[1, "一"], [2, "二"], [3, "三"], [4, "四"], [5, "五"], [6, "六"], [0, "日"]]) {
          const choice = element("button", "", name);
          choice.type = "button"; choice.dataset.weekday = day;
          choice.setAttribute("aria-label", `星期${name}`);
          choice.setAttribute("aria-pressed", String(days.has(day)));
          choice.onclick = () => {
            if (days.has(day) && days.size === 1) return;
            if (days.has(day)) days.delete(day); else days.add(day);
            choice.setAttribute("aria-pressed", String(days.has(day)));
            sourceDays.value = [1, 2, 3, 4, 5, 6, 0].filter((value) => days.has(value)).join("/");
            write();
          };
          choices.append(choice);
        }
        row.prepend(choices);
      }
      const remove = element("button");
      remove.type = "button"; remove.dataset.icon = "trash-2"; remove.title = "删除安排"; remove.setAttribute("aria-label", "删除安排");
      remove.onclick = () => { row.remove(); write(); };
      row.append(remove); table.append(row); decorateButtons(row);
    }
    function refresh() {
      if (source.value === displayed) return;
      displayed = source.value;
      table.replaceChildren();
      let invalid = false;
      for (const chunk of source.value.split(/[,，;；\n]+/).map((value) => value.trim()).filter(Boolean)) {
        const match = chunk.match(/^(\S+)\s+(\d{1,2}:\d{2})-(\d{1,2}:\d{2})(?:\s+(.+))?$/);
        const validClock = (value) => /^\d{1,2}:\d{2}$/.test(value) && Number(value.split(":")[0]) < 24 && Number(value.split(":")[1]) < 60;
        const validDays = match && /^(?:[0-6](?:-[0-6])?)(?:\/[0-6](?:-[0-6])?)*$/.test(match[1]) && match[1].split("/").every((part) => !part.includes("-") || Number(part[0]) <= Number(part[2]));
        const validDate = match && /^\d{4}-\d{2}-\d{2}$/.test(match[1]) && Number.isFinite(Date.parse(`${match[1]}T12:00:00`)) && new Date(`${match[1]}T12:00:00`).toLocaleDateString("en-CA") === match[1];
        if (match && validClock(match[2]) && validClock(match[3]) && (dated ? validDate : validDays)) addRow([match[1], match[2].padStart(5, "0"), match[3].padStart(5, "0"), match[4] || ""]);
        else invalid = true;
      }
      raw.open = invalid;
      add.disabled = invalid;
      table.hidden = invalid;
    }
    source.addEventListener("input", refresh);
    add.onclick = () => { addRow(); write(); table.lastElementChild.querySelector("input:not([type=hidden])").focus(); };
    scheduleEditors.set(id, refresh);
    refresh();
  }

  function refreshScheduleEditors() { for (const refresh of scheduleEditors.values()) refresh(); }

  function foldFlowSections(root) {
    const sections = [...root.querySelectorAll(".flow-timeline-section, .flow-completion-section, .flow-review-section")];
    if (root.matches?.(".flow-timeline-section, .flow-completion-section, .flow-review-section")) sections.push(root);
    for (const section of sections) {
      const today = Boolean(section.closest("#todayFlowGrid"));
      if ((!today && !section.classList.contains("flow-review-section")) || section.dataset.folded) continue;
      section.dataset.folded = "true";
      const key = `${today ? "today" : "history"}:${section.closest("[data-flow-date]").dataset.flowDate}:${section.className}`;
      const details = element("details", "flow-fold");
      const summary = element("summary");
      summary.append(section.querySelector(".flow-section-head"));
      details.append(summary, ...section.childNodes);
      section.append(details);
      details.open = foldStates.get(key) || false;
      details.addEventListener("toggle", () => foldStates.set(key, details.open));
    }
  }

  function initStatistics() {
    byId("summaryCharts").prepend(byId("dailyDurationCard"));
    for (const [selector, title] of [[".heatmap-card", "全年记录"], ["#bestWeekCard", "历史比较与时间组成"]]) {
      const section = document.querySelector(selector);
      const details = element("details", "statistics-fold");
      section.replaceWith(details);
      details.append(element("summary", "", title), section);
      byId("summaryCharts").after(details);
    }
  }

  function initNotebook() {
    const editor = byId("inspirationNotebook"), reading = byId("inspirationReading");
    function refreshReading() {
      reading.replaceChildren();
      const chunks = editor.value.split(/(^--- \d{4}-\d{2}-\d{2} ---$)/m);
      for (const chunk of chunks) {
        const marker = chunk.match(/^--- (\d{4}-\d{2}-\d{2}) ---$/);
        if (marker) {
          const divider = element("div", "notebook-date");
          const date = element("time", "", marker[1]); date.dateTime = marker[1];
          divider.append(date); reading.append(divider);
        } else if (chunk.trim()) reading.append(element("p", "", chunk.replace(/^\n\n|\n\n$/g, "")));
      }
      if (!reading.childNodes.length) reading.append(element("p", "flow-empty", "还没有灵感记录"));
    }
    window.addEventListener("personal-system-notebook-rendered", () => { if (!reading.hidden) refreshReading(); });
    document.addEventListener("click", (event) => {
      const button = event.target.closest("[data-notebook-mode]");
      if (!button) return;
      const read = button.dataset.notebookMode === "read";
      if (read) refreshReading();
      editor.hidden = read; reading.hidden = !read;
      for (const choice of document.querySelectorAll("[data-notebook-mode]")) choice.setAttribute("aria-pressed", String(choice === button));
      if (!read) editor.focus({ preventScroll: true });
    });
  }

  globalThis.PersonalSystemWorkspace = { updateFlowTabs, showPhaseDetails, refreshScheduleEditors };
  window.addEventListener("minimal-pomodoro-mode-change", (event) => {
    document.body.classList.toggle("statistics-page-active", event.detail.mode === "summary");
    document.body.classList.toggle("configuration-page-active", event.detail.mode === "notion");
  });
  document.addEventListener("DOMContentLoaded", () => {
    initDrawer();
    initSettings();
    initStatistics();
    initNotebook();
    const phaseDock = byId("todayPhasePlanDock");
    const phaseDetails = element("details", "today-phase-details");
    phaseDock.replaceWith(phaseDetails);
    phaseDetails.append(element("summary", "", "阶段计划"), phaseDock);
    initScheduleEditor("notionWorkWindows");
    initScheduleEditor("notionRoutineBlocks");
    initScheduleEditor("notionDateOverrides", true);
    decorateButtons(document);
    foldFlowSections(document);
    window.addEventListener("minimal-pomodoro-week-flow-rendered", () => updateFlowTabs(selectedDate));
    const observer = new MutationObserver((changes) => {
      for (const change of changes) for (const node of change.addedNodes) {
        if (node.nodeType === Node.ELEMENT_NODE) { decorateButtons(node); foldFlowSections(node); }
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    document.addEventListener("click", (event) => {
      for (const menu of document.querySelectorAll(".inline-menu[open]")) if (!menu.contains(event.target) || event.target.closest("button")) menu.open = false;
    });
    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      const menu = document.querySelector(".inline-menu[open]");
      if (menu) { event.preventDefault(); event.stopPropagation(); menu.open = false; menu.querySelector("summary").focus(); }
    });
  });
})();
