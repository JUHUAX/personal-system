const todayMode = document.getElementById("todayMode");
const recordsMode = document.getElementById("recordsMode");
const historyGridMode = document.getElementById("historyGridMode");
const historyTextMode = document.getElementById("historyTextMode");
const historyInspirationMode = document.getElementById("historyInspirationMode");
const historyPhaseMode = document.getElementById("historyPhaseMode");
const summaryMode = document.getElementById("summaryMode");
const notionMode = document.getElementById("notionMode");
const refreshBtn = document.getElementById("refreshBtn");
const backupStatus = document.getElementById("backupStatus");
const timelineTooltip = document.getElementById("timelineTooltip");
const timelineContextMenu = document.getElementById("timelineContextMenu");
const timelineContextMenuTitle = document.getElementById("timelineContextMenuTitle");
const prevWeekBtn = document.getElementById("prevWeekBtn");
const thisWeekBtn = document.getElementById("thisWeekBtn");
const nextWeekBtn = document.getElementById("nextWeekBtn");
const nowBtn = document.getElementById("nowBtn");
const gridView = document.getElementById("gridView");
const pomodoroView = document.getElementById("pomodoroView");
const textView = document.getElementById("textView");
const inspirationView = document.getElementById("inspirationView");
const todayView = document.getElementById("todayView");
const historyView = document.getElementById("historyView");
const phasePlansView = document.getElementById("phasePlansView");
const todayTimelineGrid = document.getElementById("todayTimelineGrid");
const todayFlowGrid = document.getElementById("todayFlowGrid");
const todayManageRecordsBtn = document.getElementById("todayManageRecordsBtn");
const prevDayBtn = document.getElementById("prevDayBtn");
const todayDayBtn = document.getElementById("todayDayBtn");
const nextDayBtn = document.getElementById("nextDayBtn");
const openFullWorkspaceBtn = document.getElementById("openFullWorkspaceBtn");
const startPomodoroBtn = document.getElementById("startPomodoroBtn");
const recordEditorOverlay = document.getElementById("recordEditorOverlay");
const openRecordManagerBtn = document.getElementById("openRecordManagerBtn");
const openSupplementRecordsBtn = document.getElementById("openSupplementRecordsBtn");
const closeRecordEditorBtn = document.getElementById("closeRecordEditorBtn");
const supplementRecordOverlay = document.getElementById("supplementRecordOverlay");
const supplementRecordForm = document.getElementById("supplementRecordForm");
const supplementRecordDate = document.getElementById("supplementRecordDate");
const supplementRecordText = document.getElementById("supplementRecordText");
const supplementRecordStatus = document.getElementById("supplementRecordStatus");
const submitSupplementRecordsBtn = document.getElementById("submitSupplementRecordsBtn");
const closeSupplementRecordsBtn = document.getElementById("closeSupplementRecordsBtn");
const cancelSupplementRecordsBtn = document.getElementById("cancelSupplementRecordsBtn");
const summaryView = document.getElementById("summaryView");
const notionView = document.getElementById("notionView");
const timelineGrid = document.getElementById("timelineGrid");
const gridFilterStatus = document.getElementById("gridFilterStatus");
const timelineTypeFilters = document.getElementById("timelineTypeFilters");
let timelineTypeFilterButtons = [...document.querySelectorAll(".timeline-type-filter")];
const addTimelineTypeBtn = document.getElementById("addTimelineTypeBtn");
const gridAutoFillToggle = document.getElementById("gridAutoFillToggle");
const weekFlowGrid = document.getElementById("weekFlowGrid");
const inspirationBoard = document.getElementById("inspirationBoard");
const summary = document.getElementById("summary");
const summarySidebar = document.getElementById("summarySidebar");
const summaryCollapseBtn = document.getElementById("summaryCollapseBtn");

const dailyDurationTitle = document.getElementById("dailyDurationTitle");
const dailyDurationMeta = document.getElementById("dailyDurationMeta");
const dailyDurationVisual = document.getElementById("dailyDurationVisual");
const bestWeekContent = document.getElementById("bestWeekContent");
const timeCompositionChart = document.getElementById("timeCompositionChart");
const calendarProgress = document.getElementById("calendarProgress");
const activityHeatmap = document.getElementById("activityHeatmap");

const weeklyCompareChart = document.getElementById("weeklyCompareChart");
const taskRankingChart = document.getElementById("taskRankingChart");
const workTimeDistributionChart = document.getElementById("workTimeDistributionChart");
const workTimeDistributionMeta = document.getElementById("workTimeDistributionMeta");
const taskRankingTitle = document.getElementById("taskRankingTitle");
const dateText = document.getElementById("dateText");
const pageTitle = document.getElementById("pageTitle");

const recordForm = document.getElementById("recordForm");
const recordId = document.getElementById("recordId");
const recordDateKey = document.getElementById("recordDateKey");
const recordDate = document.getElementById("recordDate");
const recordType = document.getElementById("recordType");
const recordContent = document.getElementById("recordContent");
const recordStart = document.getElementById("recordStart");
const recordEnd = document.getElementById("recordEnd");
const recordRound = document.getElementById("recordRound");
const recordReviewFields = document.getElementById("recordReviewFields");
const recordCompletion = document.getElementById("recordCompletion");
const recordFocus = document.getElementById("recordFocus");
const recordInterruption = document.getElementById("recordInterruption");
const recordReviewNote = document.getElementById("recordReviewNote");
const editorTitle = document.getElementById("editorTitle");
const clearFormBtn = document.getElementById("clearFormBtn");
const deleteEditingBtn = document.getElementById("deleteEditingBtn");
const startRecordPomodoroBtn = document.getElementById("startRecordPomodoroBtn");
const timePickerTriggers = [...document.querySelectorAll("[data-time-picker-for]")];
const customTimePicker = document.getElementById("customTimePicker");
const customTimePickerValue = document.getElementById("customTimePickerValue");
const customTimePickerHours = document.getElementById("customTimePickerHours");
const customTimePickerMinutes = document.getElementById("customTimePickerMinutes");
const customTimePickerClose = document.getElementById("customTimePickerClose");
const customTimePickerNow = document.getElementById("customTimePickerNow");
const customTimePickerDone = document.getElementById("customTimePickerDone");
const recordList = document.getElementById("recordList");
const recordCount = document.getElementById("recordCount");
const weekSummaryMeta = document.getElementById("weekSummaryMeta");
const weekSummary = document.getElementById("weekSummary");
const daySummary = document.getElementById("daySummary");

let records = [];
let historicalRecords = [];
let inspirationsByDate = {};
const GRID_CREATE_SNAP_MINUTES = 5;
const GRID_CREATE_DEFAULT_MINUTES = 25;
let gridCreateSession = null;
let currentWeekStart = startOfWeek(new Date());
let selectedTodayDate = startOfDay(new Date());
let summarySidebarCollapsed = false;
let focusNowAfterRender = true;
let loadRequestSequence = 0;
let recordDragSession = null;
let contextMenuRecord = null;
const gridTodosByDate = new Map();
let suppressGridBlockClickUntil = 0;
const visibleTimelineTypes = new Set(["work", "break", "life", "entertainment"]);
const GRID_AUTO_FILL_SETTING_KEY = "minimalPomodoroGridAutoFill";
const CUSTOM_TIMELINE_TYPES_KEY = "minimalPomodoroCustomTypes";
const customTimelineTypes = new Map();
let showGridAutoFill = true;
let lastHistoryMode = "grid";
let todayFocusPending = true;
let historyTodayFocusRequest = 0;
let timelineStorageRefreshTimer = null;
let inspirationSaveTimer = null;
let activeTimePickerInput = null;
let selectedPickerHour = 9;
let selectedPickerMinute = 0;

init();

function init() {
  todayMode.addEventListener("click", () => refreshAndSetMode("today"));
  recordsMode.addEventListener("click", () => refreshAndSetMode(lastHistoryMode));
  historyGridMode.addEventListener("click", () => refreshAndSetMode("grid"));
  historyTextMode.addEventListener("click", () => refreshAndSetMode("text"));
  historyInspirationMode?.addEventListener("click", () => refreshAndSetMode("inspiration"));
  historyPhaseMode.addEventListener("click", () => refreshAndSetMode("phases"));
  summaryMode.addEventListener("click", () => refreshAndSetMode("summary"));
  notionMode.addEventListener("click", () => refreshAndSetMode("notion"));
  refreshBtn.addEventListener("click", refreshCurrentView);
  weekFlowGrid.addEventListener("click", handleFlowRecordClick);
  weekFlowGrid.addEventListener("input", handleFlowInspirationInput);
  inspirationBoard?.addEventListener("input", handleFlowInspirationInput);

  prevWeekBtn.addEventListener("click", () => {
    focusNowAfterRender = false;
    currentWeekStart.setDate(currentWeekStart.getDate() - 7);
    loadRecords();
  });

  thisWeekBtn.addEventListener("click", async () => {
    focusNowAfterRender = false;
    currentWeekStart = startOfWeek(new Date());
    await loadRecords();
    scheduleVisibleHistoryTodayFocus({ behavior: "smooth" });
  });

  nextWeekBtn.addEventListener("click", () => {
    focusNowAfterRender = false;
    currentWeekStart.setDate(currentWeekStart.getDate() + 7);
    loadRecords();
  });

  nowBtn.addEventListener("click", goToNow);
  prevDayBtn?.addEventListener("click", () => shiftTodayDate(-1));
  nextDayBtn?.addEventListener("click", () => shiftTodayDate(1));
  todayDayBtn?.addEventListener("click", () => selectTodayDate(new Date()));
  openFullWorkspaceBtn?.addEventListener("click", () => {
    chrome.tabs.create({ url: chrome.runtime.getURL("timeline.html?mode=today"), active: true });
  });
  startPomodoroBtn?.addEventListener("click", () => {
    const controller = document.getElementById("pomodoroFrame")?.contentWindow?.MinimalPomodoroController;
    controller?.openPip?.();
  });
  openRecordManagerBtn.addEventListener("click", () =>
    openRecordEditor({ showList: true })
  );
  openSupplementRecordsBtn?.addEventListener("click", openSupplementRecordDialog);
  todayManageRecordsBtn.addEventListener("click", () => openRecordEditor({ showList: true }));
  todayTimelineGrid.addEventListener("click", handleTodayGridClick);
  todayTimelineGrid.addEventListener("pointerdown", handleTodayGridPointerDown);
  todayTimelineGrid.addEventListener("contextmenu", handleTodayGridContextMenu);
  todayTimelineGrid.addEventListener("pointerover", handleTodayGridPointerOver);
  todayTimelineGrid.addEventListener("pointermove", moveTimelineTooltip);
  todayTimelineGrid.addEventListener("pointerout", (event) => {
    const block = event.target.closest(".record[data-record-id]");
    if (block && (!event.relatedTarget || !block.contains(event.relatedTarget))) hideTimelineTooltip();
  });
  todayFlowGrid.addEventListener("click", handleFlowRecordClick);
  closeRecordEditorBtn.addEventListener("click", closeRecordEditor);
  bindBackdropDismiss(recordEditorOverlay, closeRecordEditor);
  closeSupplementRecordsBtn?.addEventListener("click", closeSupplementRecordDialog);
  cancelSupplementRecordsBtn?.addEventListener("click", closeSupplementRecordDialog);
  supplementRecordForm?.addEventListener("submit", submitSupplementRecords);
  if (supplementRecordOverlay) bindBackdropDismiss(supplementRecordOverlay, closeSupplementRecordDialog);
  timelineContextMenu.addEventListener("click", handleTimelineContextMenuAction);
  document.addEventListener("pointerdown", (event) => {
    if (!timelineContextMenu.contains(event.target)) hideTimelineContextMenu();
  });
  window.addEventListener("scroll", hideTimelineContextMenu, true);
  window.addEventListener("blur", hideTimelineContextMenu);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !timelineContextMenu.classList.contains("hidden")) {
      hideTimelineContextMenu();
      return;
    }
    if (event.key === "Escape" && !customTimePicker?.classList.contains("hidden")) {
      closeCustomTimePicker();
      return;
    }
    if (event.key === "Escape" && !recordEditorOverlay.classList.contains("hidden")) {
      closeRecordEditor();
      return;
    }
    if (event.key === "Escape" && !supplementRecordOverlay?.classList.contains("hidden")) {
      closeSupplementRecordDialog();
      return;
    }
  });
  timelineTypeFilters?.addEventListener("click", (event) => {
    const button = event.target.closest(".timeline-type-filter");
    if (button) toggleTimelineTypeFilter(button);
  });
  addTimelineTypeBtn?.addEventListener("click", addCustomTimelineType);
  gridAutoFillToggle?.addEventListener("change", async () => {
    showGridAutoFill = gridAutoFillToggle.checked;
    await chrome.storage.local.set({ [GRID_AUTO_FILL_SETTING_KEY]: showGridAutoFill });
    renderGrid();
  });
  window.addEventListener("minimal-pomodoro-grid-todos", (event) => {
    if (!event.detail?.merge) gridTodosByDate.clear();
    for (const [dateKey, todos] of Object.entries(event.detail?.todosByDate || {})) {
      gridTodosByDate.set(dateKey, Array.isArray(todos) ? todos : []);
    }
    // Todo updates must not rebuild the whole Today flow card. Rebuilding it
    // replaces already rendered Notion data with loading placeholders and was
    // the cause of todos intermittently disappearing while parallel reads
    // completed in a different order.
    if (!gridView.classList.contains("hidden") || !todayView.classList.contains("hidden")) renderGrid();
  });
  recordForm.addEventListener("submit", saveFormRecord);
  recordType.addEventListener("change", syncRecordReviewFieldVisibility);
  clearFormBtn.addEventListener("click", resetForm);
  deleteEditingBtn.addEventListener("click", () => {
    if (recordId.value && recordDateKey.value) deleteRecord(recordDateKey.value, recordId.value);
  });
  startRecordPomodoroBtn?.addEventListener("click", startPomodoroFromEditingRecord);
  for (const trigger of timePickerTriggers) {
    trigger.addEventListener("click", () => openCustomTimePicker(trigger));
  }
  customTimePicker?.addEventListener("click", handleCustomTimePickerClick);
  customTimePickerClose?.addEventListener("click", closeCustomTimePicker);
  customTimePickerDone?.addEventListener("click", closeCustomTimePicker);
  customTimePickerNow?.addEventListener("click", selectCurrentPickerTime);
  document.addEventListener("pointerdown", dismissCustomTimePicker);
  summaryCollapseBtn?.addEventListener("click", toggleSummarySidebar);

  resetForm();
  restoreSummarySidebarState();
  loadGridAutoFillSetting();
  window.setInterval(updateCurrentTimeIndicator, 30 * 1000);
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "local" || !Object.keys(changes).some((key) => key.startsWith("minimalPomodoroTimeline:"))) return;
    window.clearTimeout(timelineStorageRefreshTimer);
    timelineStorageRefreshTimer = window.setTimeout(() => {
      loadRecords({ planningRemote: false }).catch((error) => console.warn("Unable to refresh local timeline", error));
    }, 80);
  });
  const search = new URLSearchParams(location.search);
  const requestedMode = search.get("mode");
  document.body.classList.toggle("compact-today-window", search.get("compact") === "1");
  if (["today", "grid", "text", "inspiration", "phases", "summary", "notion"].includes(requestedMode)) setMode(requestedMode);
  loadCustomTimelineTypes().then(() => refreshTimelineTypeControls()).then(() => purgeLegacyAutoFilledRecords()).then(async () => {
    await loadRecords();
    if (requestedMode === "grid" || requestedMode === "text") {
      scheduleHistoryTodayFocus(requestedMode, { behavior: "auto" });
    }
  });
}

async function loadCustomTimelineTypes() {
  const saved = await chrome.storage.local.get(CUSTOM_TIMELINE_TYPES_KEY);
  customTimelineTypes.clear();
  for (const item of Array.isArray(saved[CUSTOM_TIMELINE_TYPES_KEY]) ? saved[CUSTOM_TIMELINE_TYPES_KEY] : []) {
    const id = normalizeCustomTypeId(item?.id || item?.label);
    const label = String(item?.label || "").trim().slice(0, 24);
    if (id && label && !["work", "break", "life", "entertainment"].includes(id)) customTimelineTypes.set(id, label);
  }
}

function normalizeCustomTypeId(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);
}

async function addCustomTimelineType() {
  const label = window.prompt("请输入新的时间块类型名称（最多 24 个字符）", "学习");
  const cleanLabel = String(label || "").trim().slice(0, 24);
  const id = normalizeCustomTypeId(cleanLabel);
  if (!id) return;
  if (["work", "break", "life", "entertainment"].includes(id) || customTimelineTypes.has(id)) {
    setBackupStatus("该时间块类型已经存在。");
    return;
  }
  customTimelineTypes.set(id, cleanLabel);
  await chrome.storage.local.set({
    [CUSTOM_TIMELINE_TYPES_KEY]: [...customTimelineTypes].map(([typeId, typeLabel]) => ({ id: typeId, label: typeLabel })),
  });
  refreshTimelineTypeControls();
  recordType.value = id;
  syncRecordReviewFieldVisibility();
  setBackupStatus(`已添加时间块类型：${cleanLabel}`);
}

function refreshTimelineTypeControls() {
  if (!timelineTypeFilters) return;
  for (const button of [...timelineTypeFilters.querySelectorAll(".timeline-type-filter.custom")]) button.remove();
  for (const [id, label] of customTimelineTypes) {
    const button = document.createElement("button");
    button.className = "timeline-type-filter custom active";
    button.type = "button";
    button.dataset.type = id;
    button.setAttribute("aria-pressed", "true");
    button.innerHTML = `<span class="filter-dot"></span>${escapeHtml(label)} <span class="filter-count" data-filter-count="${escapeHtml(id)}">0</span>`;
    timelineTypeFilters.insertBefore(button, addTimelineTypeBtn || timelineTypeFilters.firstChild);
    visibleTimelineTypes.add(id);
  }
  recordType.innerHTML = [
    ["work", "工作"], ["break", "休息"], ["life", "生活"], ["entertainment", "娱乐"],
    ...customTimelineTypes,
  ].map(([id, label]) => `<option value="${escapeHtml(id)}">${escapeHtml(label)}</option>`).join("");
  timelineTypeFilterButtons = [...document.querySelectorAll(".timeline-type-filter")];
}

async function loadGridAutoFillSetting() {
  const saved = await chrome.storage.local.get(GRID_AUTO_FILL_SETTING_KEY);
  showGridAutoFill = saved[GRID_AUTO_FILL_SETTING_KEY] !== false;
  if (gridAutoFillToggle) gridAutoFillToggle.checked = showGridAutoFill;
  renderGrid();
}

async function purgeLegacyAutoFilledRecords() {
  const storage = await chrome.storage.local.get(null);
  const payload = {};
  for (const [key, value] of Object.entries(storage)) {
    if (!key.startsWith("minimalPomodoroTimeline:") || !Array.isArray(value)) continue;
    const realRecords = value.filter((record) => !record?.autoFilled);
    if (realRecords.length !== value.length) payload[key] = realRecords;
  }
  if (Object.keys(payload).length) await chrome.storage.local.set(payload);
}

function bindBackdropDismiss(overlay, close) {
  let startedOnBackdrop = false;
  overlay.addEventListener("pointerdown", (event) => {
    startedOnBackdrop = event.target === overlay;
  });
  overlay.addEventListener("pointercancel", () => {
    startedOnBackdrop = false;
  });
  overlay.addEventListener("click", (event) => {
    const shouldClose = startedOnBackdrop && event.target === overlay;
    startedOnBackdrop = false;
    if (shouldClose) close();
  });
}

function openCustomTimePicker(trigger) {
  const input = document.getElementById(trigger.dataset.timePickerFor);
  if (!input || !customTimePicker) return;
  const [hour, minute] = String(input.value || timestampToTime(Date.now())).split(":").map(Number);
  activeTimePickerInput = input;
  selectedPickerHour = Number.isFinite(hour) ? hour : 9;
  selectedPickerMinute = Number.isFinite(minute) ? minute : 0;
  renderCustomTimePickerOptions();
  customTimePicker.classList.remove("hidden");
  const rect = trigger.getBoundingClientRect();
  const pickerRect = customTimePicker.getBoundingClientRect();
  const margin = 10;
  customTimePicker.style.left = `${Math.max(margin, Math.min(rect.right - pickerRect.width, window.innerWidth - pickerRect.width - margin))}px`;
  customTimePicker.style.top = `${Math.max(margin, Math.min(rect.bottom + 8, window.innerHeight - pickerRect.height - margin))}px`;
  customTimePicker.querySelector(".selected")?.scrollIntoView({ block: "center" });
}

function renderCustomTimePickerOptions() {
  if (!customTimePickerHours || !customTimePickerMinutes) return;
  const minuteOptions = [...new Set([...Array.from({ length: 12 }, (_, index) => index * 5), selectedPickerMinute])].sort((a, b) => a - b);
  customTimePickerHours.innerHTML = Array.from({ length: 24 }, (_, hour) =>
    `<button type="button" data-time-hour="${hour}" class="${hour === selectedPickerHour ? "selected" : ""}">${String(hour).padStart(2, "0")}</button>`
  ).join("");
  customTimePickerMinutes.innerHTML = minuteOptions.map((minute) =>
    `<button type="button" data-time-minute="${minute}" class="${minute === selectedPickerMinute ? "selected" : ""}">${String(minute).padStart(2, "0")}</button>`
  ).join("");
  customTimePickerValue.textContent = `${String(selectedPickerHour).padStart(2, "0")}:${String(selectedPickerMinute).padStart(2, "0")}`;
}

function handleCustomTimePickerClick(event) {
  const hourButton = event.target.closest("button[data-time-hour]");
  const minuteButton = event.target.closest("button[data-time-minute]");
  if (hourButton) selectedPickerHour = Number(hourButton.dataset.timeHour);
  if (minuteButton) selectedPickerMinute = Number(minuteButton.dataset.timeMinute);
  if (!hourButton && !minuteButton) return;
  applyCustomTimePickerValue();
  renderCustomTimePickerOptions();
}

function applyCustomTimePickerValue() {
  if (!activeTimePickerInput) return;
  activeTimePickerInput.value = `${String(selectedPickerHour).padStart(2, "0")}:${String(selectedPickerMinute).padStart(2, "0")}`;
  activeTimePickerInput.dispatchEvent(new Event("change", { bubbles: true }));
}

function selectCurrentPickerTime() {
  const now = new Date();
  selectedPickerHour = now.getHours();
  selectedPickerMinute = Math.round(now.getMinutes() / 5) * 5;
  if (selectedPickerMinute === 60) {
    selectedPickerHour = (selectedPickerHour + 1) % 24;
    selectedPickerMinute = 0;
  }
  applyCustomTimePickerValue();
  renderCustomTimePickerOptions();
}

function dismissCustomTimePicker(event) {
  if (!customTimePicker || customTimePicker.classList.contains("hidden")) return;
  if (customTimePicker.contains(event.target) || event.target.closest("[data-time-picker-for]")) return;
  closeCustomTimePicker();
}

function closeCustomTimePicker() {
  customTimePicker?.classList.add("hidden");
  activeTimePickerInput?.focus();
  activeTimePickerInput = null;
}

async function goToNow() {
  focusNowAfterRender = true;
  selectedTodayDate = startOfDay(new Date());
  currentWeekStart = startOfWeek(new Date());
  setMode("today");
  await loadRecords();
}

async function refreshAndSetMode(mode) {
  if (mode === "today") {
    currentWeekStart = startOfWeek(selectedTodayDate);
    todayFocusPending = true;
  }
  setMode(mode);
  await loadRecords();
  if (mode === "grid" || mode === "text") {
    scheduleHistoryTodayFocus(mode, { behavior: "smooth" });
  }
}

async function shiftTodayDate(offset) {
  const next = new Date(selectedTodayDate);
  next.setDate(next.getDate() + offset);
  await selectTodayDate(next);
}

async function selectTodayDate(date) {
  selectedTodayDate = startOfDay(date);
  currentWeekStart = startOfWeek(selectedTodayDate);
  todayFocusPending = toDateKey(selectedTodayDate) === todayKey();
  await loadRecords();
}

async function refreshCurrentView() {
  await loadRecords();
  if (!phasePlansView.classList.contains("hidden")) {
    window.dispatchEvent(new CustomEvent("minimal-pomodoro-mode-change", { detail: { mode: "phases" } }));
  }
  scheduleVisibleHistoryTodayFocus({ behavior: "smooth" });
}

function openRecordEditor({ focusContent = false, showList = false } = {}) {
  recordEditorOverlay.classList.toggle("list-visible", showList);
  recordEditorOverlay.classList.remove("hidden");
  document.body.classList.add("record-editor-open");
  renderList();

  requestAnimationFrame(() => {
    const activeItem = recordList.querySelector(".item.editing");
    activeItem?.scrollIntoView({ block: "nearest" });
    if (focusContent) {
      recordContent.focus();
    } else {
      closeRecordEditorBtn.focus();
    }
  });
}

function handleFlowRecordClick(event) {
  const flowRecord = event.target.closest(".flow-record[data-record-id]");
  if (!flowRecord) return;
  const dateKey = flowRecord.dataset.dateKey;
  const id = flowRecord.dataset.recordId;
  if (!dateKey || !id) return;
  fillForm(dateKey, id);
  const mergedIds = String(flowRecord.dataset.mergedIds || "").split(",").filter(Boolean);
  if (mergedIds.length > 1) {
    highlightMergedRecordGroup(dateKey, new Set(mergedIds));
    setBackupStatus(`已打开连续工作组的第一条记录，共 ${mergedIds.length} 条。`);
  }
}

for (const flowContainer of [weekFlowGrid, todayFlowGrid]) {
  flowContainer.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    if (!event.target.closest(".flow-record[data-record-id]")) return;
    event.preventDefault();
    handleFlowRecordClick(event);
  });
}

function syncRecordReviewFieldVisibility() {
  if (!recordReviewFields) return;
  recordReviewFields.classList.toggle("hidden", recordType.value !== "work");
}

function compactReviewText(record) {
  if (record.mergedRecords?.length > 1) {
    const reviewed = record.mergedRecords.filter((item) => getReviewText(item) && item.reviewPending !== true).length;
    const pending = record.mergedRecords.filter((item) => item.reviewPending === true).length;
    const parts = [];
    if (reviewed) parts.push(`${reviewed} 条已评价`);
    if (pending) parts.push(`${pending} 条待评价`);
    return parts.join(" · ");
  }
  return getReviewText(record);
}

function closeRecordEditor() {
  recordEditorOverlay.classList.add("hidden");
  recordEditorOverlay.classList.remove("list-visible");
  document.body.classList.remove("record-editor-open");
  hideTimelineTooltip();
}

function toggleTimelineTypeFilter(button) {
  const type = button.dataset.type;
  if (!type) return;

  if (visibleTimelineTypes.has(type)) {
    visibleTimelineTypes.delete(type);
  } else {
    visibleTimelineTypes.add(type);
  }

  const isVisible = visibleTimelineTypes.has(type);
  button.classList.toggle("active", isVisible);
  button.setAttribute("aria-pressed", String(isVisible));
  renderGrid();
}

async function loadRecords(options = {}) {
  const requestSequence = ++loadRequestSequence;
  const keys = weekDateKeys();
  const storageKeys = keys.map((key) => timelineStorageKey(key));
  const inspirationKeys = keys.map((key) => inspirationStorageKey(key));
  const result = await chrome.storage.local.get([...storageKeys, ...inspirationKeys]);
  if (requestSequence !== loadRequestSequence) return;

  records = [];
  for (const dateKey of keys) {
    const key = timelineStorageKey(dateKey);
    const dayRecords = Array.isArray(result[key]) ? result[key] : [];
    for (const record of dayRecords) {
      records.push({ ...record, dateKey });
    }
  }

  inspirationsByDate = {};
  for (const dateKey of keys) {
    const stored = result[inspirationStorageKey(dateKey)];
    inspirationsByDate[dateKey] = normalizeInspirationText(stored);
  }

  const hadLegacyAutoFilledRecords = records.some((record) => record.autoFilled);
  records = records.filter((record) => !record.autoFilled);
  normalizeAndSortRecords();
  if (hadLegacyAutoFilledRecords) await saveWeekRecordsDirect();
  if (requestSequence !== loadRequestSequence) return;

  const nextHistoricalRecords = await loadHistoricalRecords();
  if (requestSequence !== loadRequestSequence) return;

  historicalRecords = nextHistoricalRecords;
  render({ planningRemote: options.planningRemote !== false });
}

async function persistWeekRecords() {
  records = records.filter((record) => !record.autoFilled);
  normalizeAndSortRecords();
  await saveWeekRecordsDirect();
  historicalRecords = await loadHistoricalRecords();
  render();
}

async function loadHistoricalRecords() {
  const result = await chrome.storage.local.get(null);
  const history = [];

  for (const [storageKey, dayRecords] of Object.entries(result)) {
    if (!storageKey.startsWith("minimalPomodoroTimeline:") || !Array.isArray(dayRecords)) {
      continue;
    }

    const dateKey = storageKey.slice("minimalPomodoroTimeline:".length);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) continue;

    for (const record of dayRecords) {
      if (!record || !Number.isFinite(Number(record.start))) continue;
      if (record.autoFilled) continue;
      history.push({
        ...record,
        dateKey,
        type: normalizeRecordType(record.type),
        content: record.content || defaultContent(record.type),
        note: record.note || "",
        end: record.end == null ? null : Number(record.end),
        start: Number(record.start),
      });
    }
  }

  return history.sort((a, b) => a.start - b.start);
}

async function saveWeekRecordsDirect() {
  const grouped = new Map();
  for (const dateKey of weekDateKeys()) {
    grouped.set(dateKey, []);
  }

  for (const record of records) {
    if (record.autoFilled) continue;
    const dateKey = record.dateKey || dateKeyFromTimestamp(record.start);
    if (!grouped.has(dateKey)) grouped.set(dateKey, []);
    const { dateKey: _, ...clean } = record;
    grouped.get(dateKey).push(clean);
  }

  const payload = {};
  for (const [dateKey, dayRecords] of grouped.entries()) {
    payload[timelineStorageKey(dateKey)] = dayRecords
      .map(({ dateKey: _, ...record }) => record)
      .sort((a, b) => a.start - b.start);
  }

  await chrome.storage.local.set(payload);
}

function normalizeRecordType(type) {
  if (type === "leave") return "life";
  if (type === "access") return "entertainment";
  if (["work", "break", "life", "entertainment"].includes(type)) return type;
  const customId = normalizeCustomTypeId(type);
  return customId && (customTimelineTypes.has(customId) || customId === type) ? customId : "work";
}

function buildAutoFilledLifeBlocks(sourceRecords) {
  const additions = [];

  for (const day of weekDates()) {
    const dateKey = toDateKey(day);
    const realDayRecords = sourceRecords
      .filter((record) => (
        record.dateKey === dateKey &&
        !record.autoFilled &&
        record.end &&
        record.end > record.start
      ))
      .sort((a, b) => a.start - b.start);

    if (realDayRecords.length < 2) continue;

    const boundaryStart = parseDateKey(dateKey);
    boundaryStart.setHours(9, 0, 0, 0);
    const boundaryEnd = parseDateKey(dateKey);
    boundaryEnd.setHours(22, 0, 0, 0);

    const firstRecordStart = realDayRecords[0].start;
    const lastRecordEnd = realDayRecords.reduce(
      (latest, record) => Math.max(latest, record.end || record.start),
      firstRecordStart
    );

    const rangeStart = Math.max(boundaryStart.getTime(), firstRecordStart);
    const rangeEnd = Math.min(boundaryEnd.getTime(), lastRecordEnd);
    if (rangeEnd <= rangeStart) continue;

    const occupied = realDayRecords
      .filter((record) => record.end > rangeStart && record.start < rangeEnd)
      .map((record) => ({
        start: Math.max(rangeStart, record.start),
        end: Math.min(rangeEnd, record.end),
      }))
      .sort((a, b) => a.start - b.start);

    const merged = [];
    for (const interval of occupied) {
      const last = merged[merged.length - 1];
      if (last && interval.start <= last.end) {
        last.end = Math.max(last.end, interval.end);
      } else {
        merged.push({ ...interval });
      }
    }

    let cursor = rangeStart;
    for (const interval of merged) {
      if (interval.start - cursor >= 60 * 1000) {
        additions.push({
          id: `auto-life-${dateKey}-${cursor}`,
          dateKey,
          type: "life",
          content: "未记录时间",
          note: "由插件自动补全",
          start: cursor,
          end: interval.start,
          round: null,
          autoFilled: true,
        });
      }
      cursor = Math.max(cursor, interval.end);
    }

    if (rangeEnd - cursor >= 60 * 1000) {
      additions.push({
        id: `auto-life-${dateKey}-${cursor}`,
        dateKey,
        type: "life",
        content: "未记录时间",
        note: "由插件自动补全",
        start: cursor,
        end: rangeEnd,
        round: null,
        autoFilled: true,
      });
    }
  }

  return additions.sort((a, b) => a.start - b.start);
}

function normalizeAndSortRecords() {
  records = records
    .filter((record) => record && record.start)
    .map((record) => {
      const dateKey = record.dateKey || dateKeyFromTimestamp(record.start);
      return {
        ...record,
        dateKey,
        id: record.id || createId(),
        content: record.content || defaultContent(record.type),
        note: record.note || "",
        type: normalizeRecordType(record.type),
        end: record.end == null ? null : record.end,
      };
    })
    .sort((a, b) => a.start - b.start);
}

function render(options = {}) {
  renderHeader();
  renderSummary();
  renderGrid();
  renderText(options);
  renderInspirations();
  renderToday();
  renderSummaryDetails();
  renderDashboardCharts();
  renderAdvancedDashboard();
  renderList();
}

function renderHeader() {
  const days = weekDates();
  const first = days[0];
  const last = days[6];

  if (todayMode.classList.contains("active")) {
    const isToday = toDateKey(selectedTodayDate) === todayKey();
    pageTitle.textContent = isToday ? "今日" : "当天工作台";
    dateText.textContent = selectedTodayDate.toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric", weekday: "long" });
    todayDayBtn?.classList.toggle("active", isToday);
    thisWeekBtn.classList.toggle("active", isSameWeek(currentWeekStart, new Date()));
    nowBtn.classList.toggle("active", isToday);
    return;
  }

  if (recordsMode.classList.contains("active")) {
    pageTitle.textContent = lastHistoryMode === "phases"
      ? "时间记录 · 阶段计划"
      : lastHistoryMode === "inspiration"
        ? "时间记录 · 灵感记录"
        : lastHistoryMode === "text" ? "时间记录 · 时间流" : "时间记录 · 时间块";
  } else if (summaryMode.classList.contains("active")) {
    pageTitle.textContent = "统计";
  } else if (notionMode.classList.contains("active")) {
    pageTitle.textContent = "配置";
  } else {
    pageTitle.textContent = "时间块";
  }

  dateText.textContent = recordsMode.classList.contains("active") && lastHistoryMode === "phases"
    ? "集中管理 Notion 中的全部阶段计划"
    : recordsMode.classList.contains("active") && lastHistoryMode === "inspiration"
      ? `按周汇总每日灵感 · ${formatDate(first)} - ${formatDate(last)}`
      : `${formatDate(first)} - ${formatDate(last)}`;
  thisWeekBtn.classList.toggle("active", isSameWeek(currentWeekStart, new Date()));
  nowBtn.classList.toggle("active", isSameWeek(currentWeekStart, new Date()));
}

function renderSummary() {
  const work = records.filter((r) => r.type === "work");
  const workMinutes = work.reduce((sum, record) => sum + recordStatsMinutes(record), 0);
  const completedPomodoros = work.filter((record) => record.completedNaturally === true).length;
  const unclassifiedWorkSegments = work.filter(
    (record) => record.end != null && typeof record.completedNaturally !== "boolean"
  ).length;
  const bestDay = getBestWorkDay(records);
  const mainTask = getMainTask(records);
  const totalMinutes = records.reduce((sum, record) => sum + recordStatsMinutes(record), 0);
  const workRatio = totalMinutes > 0 ? Math.round((workMinutes / totalMinutes) * 100) : 0;
  const coverage = getRecordCoverage(records);
  const bestWeek = getBestWeekSummary();
  const bestWeekCompletion = bestWeek && bestWeek.minutes > 0
    ? Math.round((workMinutes / bestWeek.minutes) * 100)
    : 0;

  summary.innerHTML = `
    <div class="stat"><span>工作时长</span><strong>${formatDuration(workMinutes)}</strong></div>
    <div class="stat"><span>完整番茄</span><strong>${completedPomodoros}</strong><small>${unclassifiedWorkSegments ? `${unclassifiedWorkSegments} 条历史工作段未分类` : "自然倒计时完成"}</small></div>
    <div class="stat"><span>最佳工作日</span><strong>${bestDay ? escapeHtml(bestDay.label) : "—"}</strong><small>${bestDay ? formatDuration(bestDay.minutes) : "暂无记录"}</small></div>
    <div class="stat"><span>主要任务</span><strong title="${mainTask ? escapeHtml(mainTask.title) : ""}">${mainTask ? escapeHtml(mainTask.title) : "—"}</strong><small>${mainTask ? formatDuration(mainTask.minutes) : "暂无记录"}</small></div>
    <div class="stat"><span>工作比例</span><strong>${workRatio}%</strong><small>${coverage.available ? `记录覆盖 ${coverage.ratio}% · ${coverage.days}天` : "覆盖率待更多记录"}</small></div>
    <div class="stat"><span>相对最佳周</span><strong>${bestWeek ? `${bestWeekCompletion}%` : "—"}</strong><small>${bestWeek ? `最佳 ${formatDuration(bestWeek.minutes)}` : "暂无历史"}</small></div>
  `;
}

function shouldMergeDisplayRecords(previous, current) {
  if (!previous || !current) return false;
  if (previous.type !== "work" || current.type !== "work") return false;
  if ((previous.content || "工作") !== (current.content || "工作")) return false;
  if (previous.dateKey !== current.dateKey) return false;

  const previousEnd = previous.end || previous.start;
  const currentStart = current.start || current.end || previousEnd;
  return Math.abs(currentStart - previousEnd) <= 60 * 1000;
}

function buildMergedDisplayRecord(group) {
  const first = group[0];
  const last = group[group.length - 1];
  const mergedReviews = group
    .map((record, index) => ({
      index,
      start: record.start,
      end: record.end || record.start,
      reviewText: getReviewText(record),
      round: record.round,
    }));

  return {
    ...first,
    start: first.start,
    end: last.end || last.start,
    mergedRecords: group,
    mergedCount: group.length,
    mergedReviews,
    round: first.round,
  };
}

function getDisplayRecords(source = records) {
  const ordered = [...source].sort((a, b) => a.start - b.start);
  const merged = [];
  let group = [];

  for (const record of ordered) {
    if (group.length && shouldMergeDisplayRecords(group[group.length - 1], record)) {
      group.push(record);
      continue;
    }

    if (group.length) {
      merged.push(group.length > 1 ? buildMergedDisplayRecord(group) : group[0]);
    }
    group = [record];
  }

  if (group.length) {
    merged.push(group.length > 1 ? buildMergedDisplayRecord(group) : group[0]);
  }

  return merged;
}

function getGridBlockTitle(record, displayMode = "full") {
  const mergedCount = record.mergedCount || 1;

  if (record.type === "work" && mergedCount > 1) {
    if (displayMode === "compact") return `🍅×${mergedCount}`;
    return `🍅×${mergedCount} ${record.content || "工作"}`;
  }

  return displayMode === "full" ? getRecordLabel(record) : compactRecordLabel(record);
}

function renderGrid() {
  const defaultStartMinutes = 8 * 60;
  const defaultEndMinutes = 23 * 60;
  const gridRecords = showGridAutoFill
    ? [...records, ...buildAutoFilledLifeBlocks(records)].sort((a, b) => a.start - b.start)
    : records;
  const allDisplayRecords = getDisplayRecords(gridRecords);
  const displayRecords = allDisplayRecords.filter((record) =>
    visibleTimelineTypes.has(record.type)
  );
  const plannedRanges = [...gridTodosByDate.values()].flat().map((todo) => {
    const start = Date.parse(todo.plannedStart || "");
    const end = Date.parse(todo.plannedEnd || "");
    return Number.isFinite(start) && Number.isFinite(end) ? { start, end } : null;
  }).filter(Boolean);
  const range = computeDisplayRange(defaultStartMinutes, defaultEndMinutes, [...displayRecords, ...plannedRanges]);
  const rowHeight = computeRowHeight(range);
  const slotCount = Math.ceil((range.end - range.start) / 30);
  const days = weekDates();
  const isCurrentWeek = isSameWeek(currentWeekStart, new Date());
  const currentDateKey = todayKey();

  updateTimelineFilterStatus(allDisplayRecords, displayRecords);
  timelineGrid.dataset.rangeStart = String(range.start);
  timelineGrid.dataset.rangeEnd = String(range.end);
  timelineGrid.dataset.rowHeight = String(rowHeight);

  const timeCol = document.createElement("div");
  timeCol.className = "time-col";
  timeCol.innerHTML = `<div class="grid-header">时间</div>`;

  for (let i = 0; i < slotCount; i += 1) {
    const totalMinutes = range.start + i * 30;
    const hour = Math.floor(totalMinutes / 60);
    const minute = totalMinutes % 60 === 0 ? "00" : "30";
    const cell = document.createElement("div");
    cell.className = "time-cell";
    cell.style.height = `${rowHeight}px`;
    cell.textContent = `${String(hour).padStart(2, "0")}:${minute}`;
    timeCol.appendChild(cell);
  }

  timelineGrid.innerHTML = "";
  timelineGrid.appendChild(timeCol);

  for (const day of days) {
    const dateKey = toDateKey(day);
    const isToday = isCurrentWeek && dateKey === currentDateKey;
    const dayCol = document.createElement("div");
    dayCol.className = `day-col${isToday ? " today" : ""}`;
    dayCol.dataset.dateKey = dateKey;
    dayCol.innerHTML = `
      <div class="grid-header day-header"${isToday ? ' aria-current="date"' : ""}>
        <div class="day-heading"><span class="day-name">${weekdayName(day)}</span><span class="day-date">${String(day.getMonth() + 1).padStart(2, "0")}/${String(day.getDate()).padStart(2, "0")}</span></div>
        <div class="day-lane-labels"><span>实际记录</span><span>计划待办</span></div>
      </div>
    `;

    const track = document.createElement("div");
    track.className = "day-track";
    track.style.height = `${slotCount * rowHeight}px`;
    track.style.background = `repeating-linear-gradient(to bottom, transparent 0, transparent ${Math.max(rowHeight - 1, 1)}px, rgba(145,190,255,0.10) ${rowHeight}px)`;
    track.dataset.dateKey = dateKey;
    track.addEventListener("pointerdown", (event) => {
      beginGridTimeBlockCreation(event, track, dateKey, range, rowHeight);
    });

    const dayRecords = displayRecords.filter((record) => record.dateKey === dateKey);
    const layoutRecords = assignLanes(dayRecords, range);

    for (const item of layoutRecords) {
      const { record, lane, laneCount, startMinutes, endMinutes } = item;
      const rawTop = Math.max(0, ((startMinutes - range.start) / 30) * rowHeight);
      const rawHeight = Math.max(4, ((Math.max(endMinutes, startMinutes + 1) - startMinutes) / 30) * rowHeight);
      const verticalInset = rawHeight >= 10 ? 2 : 1;
      const top = rawTop + verticalInset;
      const height = Math.max(4, rawHeight - verticalInset * 2);

      const gap = 6;
      const leftPercent = (lane / laneCount) * 100;
      const widthPercent = 100 / laneCount;

      const block = document.createElement("div");
      block.className = `record ${record.type}`;
      const sourceRecords = record.mergedRecords?.length ? record.mergedRecords : [record];
      block.dataset.dateKey = record.dateKey;
      block.dataset.recordId = sourceRecords[0]?.id || "";
      block.dataset.mergedIds = sourceRecords.map((item) => item.id).join(",");
      block.dataset.autoFilled = record.autoFilled ? "true" : "false";
      const isOngoing = record.end == null ||
        record.mergedRecords?.some((mergedRecord) => mergedRecord.end == null);
      if (isOngoing) {
        block.classList.add("ongoing");
        block.setAttribute("aria-label", `${getRecordLabel(record)}，正在进行`);
      }
      const durationMinutes = Math.max(endMinutes - startMinutes, 0);
      const displayMode = recordDisplayMode(height, durationMinutes, rowHeight);

      if (displayMode === "tiny") {
        block.classList.add("tiny");
      } else if (displayMode === "compact") {
        block.classList.add("compact");
      }

      block.style.top = `${top}px`;
      block.style.height = `${height}px`;
      block.style.left = `calc(${leftPercent}% + ${gap}px)`;
      block.style.width = `calc(${widthPercent}% - ${gap * 2}px)`;
      block.removeAttribute("title");
      block.addEventListener("pointerdown", (event) => {
        beginRecordDrag(event, block, record, range, rowHeight);
      });
      block.addEventListener("contextmenu", (event) => {
        openTimelineContextMenu(event, record);
      });
      block.addEventListener("mouseenter", (event) => showTimelineTooltip(event, record));
      block.addEventListener("mousemove", moveTimelineTooltip);
      block.addEventListener("mouseleave", hideTimelineTooltip);
      block.addEventListener("click", () => {
        if (Date.now() < suppressGridBlockClickUntil) return;
        hideTimelineTooltip();
        if (record.autoFilled) return;

        if (record.mergedRecords?.length > 1) {
          const mergedIds = new Set(record.mergedRecords.map((item) => item.id));
          fillForm(record.dateKey, record.mergedRecords[0].id);
          highlightMergedRecordGroup(record.dateKey, mergedIds);
          setBackupStatus(`已定位连续工作组，共 ${record.mergedRecords.length} 条原始记录。`);
          return;
        }

        fillForm(record.dateKey, record.id);
      });

      const title = document.createElement("span");
      title.className = "record-title";
      title.textContent = getGridBlockTitle(record, displayMode);
      block.appendChild(title);

      track.appendChild(block);
    }

    if (isToday) {
      const currentTimeLine = document.createElement("div");
      currentTimeLine.className = "current-time-line";
      currentTimeLine.innerHTML = `<span class="current-time-label"></span>`;
      track.appendChild(currentTimeLine);
    }

    const plannedTrack = document.createElement("div");
    plannedTrack.className = "todo-plan-track";
    plannedTrack.style.height = `${slotCount * rowHeight}px`;
    plannedTrack.style.background = track.style.background;
    const plannedTodos = gridTodosByDate.get(dateKey) || [];
    for (const todo of plannedTodos) {
      const start = Date.parse(todo.plannedStart || "");
      const end = Date.parse(todo.plannedEnd || "");
      if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) continue;
      const startMinutes = Math.max(range.start, minutesOfDay(start));
      const endMinutes = Math.min(range.end, minutesOfDay(end));
      if (endMinutes <= startMinutes) continue;
      const rawTop = ((startMinutes - range.start) / 30) * rowHeight;
      const rawHeight = Math.max(6, ((endMinutes - startMinutes) / 30) * rowHeight);
      const block = document.createElement("button");
      block.type = "button";
      block.className = `planned-todo-block priority-${todo.priority || "medium"}${todo.status === "done" ? " is-done" : ""}`;
      block.dataset.dateKey = dateKey;
      block.dataset.todoId = todo.id;
      block.style.top = `${rawTop + 2}px`;
      block.style.height = `${Math.max(5, rawHeight - 4)}px`;
      block.textContent = todo.title || "未命名待办";
      block.title = `${todo.title || "未命名待办"}\n${formatTime(start)}–${formatTime(end)}${todo.status === "done" ? "\n已完成" : ""}`;
      block.addEventListener("click", () => {
        window.dispatchEvent(new CustomEvent("minimal-pomodoro-open-grid-todo", {
          detail: { dateKey, todoId: todo.id, todo },
        }));
      });
      plannedTrack.appendChild(block);
    }
    if (!plannedTodos.some((todo) => todo.plannedStart && todo.plannedEnd)) {
      const empty = document.createElement("span");
      empty.className = "todo-plan-empty";
      empty.textContent = "无排程待办";
      plannedTrack.appendChild(empty);
    }

    const tracks = document.createElement("div");
    tracks.className = "day-tracks";
    tracks.append(track, plannedTrack);
    dayCol.appendChild(tracks);
    timelineGrid.appendChild(dayCol);
  }

  updateCurrentTimeIndicator();
  if (focusNowAfterRender && !gridView.classList.contains("hidden")) {
    focusNowAfterRender = false;
    requestAnimationFrame(() => focusCurrentTime({ behavior: "smooth" }));
  }
}

function updateTimelineFilterStatus(allRecords, visibleRecords) {
  const counts = new Map([
    ["work", 0],
    ["break", 0],
    ["life", 0],
    ["entertainment", 0],
  ]);

  for (const record of allRecords) {
    counts.set(record.type, (counts.get(record.type) || 0) + 1);
  }

  for (const button of timelineTypeFilterButtons) {
    const count = button.querySelector(".filter-count");
    if (count) count.textContent = String(counts.get(button.dataset.type) || 0);
  }

  if (!gridFilterStatus) return;
  if (visibleRecords.length === allRecords.length) {
    gridFilterStatus.textContent = `显示全部 ${allRecords.length} 个时间块`;
    return;
  }

  gridFilterStatus.textContent = `显示 ${visibleRecords.length} / ${allRecords.length} 个时间块`;
}

function updateCurrentTimeIndicator() {
  if (!isSameWeek(currentWeekStart, new Date())) return;

  const rangeStart = Number(timelineGrid.dataset.rangeStart);
  const rangeEnd = Number(timelineGrid.dataset.rangeEnd);
  const rowHeight = Number(timelineGrid.dataset.rowHeight);
  if (![rangeStart, rangeEnd, rowHeight].every(Number.isFinite)) return;

  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
  const isVisible = nowMinutes >= rangeStart && nowMinutes <= rangeEnd;
  const top = ((nowMinutes - rangeStart) / 30) * rowHeight;
  for (const line of [
    timelineGrid.querySelector(".current-time-line"),
    todayTimelineGrid?.querySelector(".current-time-line"),
  ].filter(Boolean)) {
    line.classList.toggle("hidden", !isVisible);
    if (!isVisible) continue;
    line.style.top = `${top}px`;
    const label = line.querySelector(".current-time-label");
    if (label) label.textContent = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  }
}

function focusCurrentTime({ behavior = "auto" } = {}) {
  const line = timelineGrid.querySelector(".current-time-line:not(.hidden)");
  if (!line) return;

  const rect = line.getBoundingClientRect();
  const targetTop = window.scrollY + rect.top - window.innerHeight * 0.36;
  window.scrollTo({
    top: Math.max(0, targetTop),
    behavior,
  });
  line.classList.remove("focus-pulse");
  requestAnimationFrame(() => line.classList.add("focus-pulse"));
}

function getDisplayRecordMembers(displayRecord) {
  const references = displayRecord.mergedRecords?.length
    ? displayRecord.mergedRecords
    : [displayRecord];

  return references
    .map((reference) =>
      records.find((record) =>
        record.id === reference.id && record.dateKey === reference.dateKey
      )
    )
    .filter(Boolean);
}

function isDisplayRecordOngoing(displayRecord) {
  return getDisplayRecordMembers(displayRecord).some((record) => record.end == null);
}

function isDisplayRecordAutoFilled(displayRecord) {
  if (displayRecord?.autoFilled) return true;
  const members = getDisplayRecordMembers(displayRecord);
  return members.length > 0 && members.every((record) => record.autoFilled);
}

function rawPointerMinutesInTrack(event, track, range, rowHeight) {
  const rect = track.getBoundingClientRect();
  return range.start + ((event.clientY - rect.top) / rowHeight) * 30;
}

function beginRecordDrag(event, block, displayRecord, range, rowHeight) {
  if (event.button !== 0 || recordDragSession) return;
  if (isDisplayRecordOngoing(displayRecord) || isDisplayRecordAutoFilled(displayRecord)) return;

  const members = getDisplayRecordMembers(displayRecord);
  if (!members.length) return;

  const sourceTrack = block.closest(".day-track");
  if (!sourceTrack) return;

  const groupStart = Math.min(...members.map((record) => Number(record.start)));
  const groupEnd = Math.max(...members.map((record) => Number(record.end || record.start)));
  const pointerMinutes = rawPointerMinutesInTrack(event, sourceTrack, range, rowHeight);

  recordDragSession = {
    block,
    displayRecord,
    members,
    range,
    rowHeight,
    sourceX: event.clientX,
    sourceY: event.clientY,
    groupStart,
    groupEnd,
    grabOffsetMinutes: pointerMinutes - minutesOfDay(groupStart),
    active: false,
    validTarget: false,
    targetDateKey: displayRecord.dateKey,
    targetStartMinutes: minutesOfDay(groupStart),
    preview: null,
  };

  window.addEventListener("pointermove", handleRecordDragMove);
  window.addEventListener("pointerup", handleRecordDragEnd, { once: true });
  window.addEventListener("pointercancel", cancelRecordDrag, { once: true });
}

function activateRecordDrag(session) {
  session.active = true;
  session.block.classList.add("dragging-source");
  session.preview = session.block.cloneNode(true);
  session.preview.classList.remove("dragging-source", "ongoing");
  session.preview.classList.add("record-drag-preview");
  session.preview.style.left = "6px";
  session.preview.style.width = "calc(100% - 12px)";
  session.block.closest(".day-track")?.appendChild(session.preview);
  document.body.classList.add("record-dragging");
  hideTimelineTooltip();
  hideTimelineContextMenu();
}

function autoScrollTimelineDuringDrag(event) {
  const viewportEdge = 64;
  if (event.clientY < viewportEdge) {
    window.scrollBy(0, -14);
  } else if (event.clientY > window.innerHeight - viewportEdge) {
    window.scrollBy(0, 14);
  }

  const gridShell = timelineGrid.closest(".grid-shell");
  if (!gridShell) return;
  const shellRect = gridShell.getBoundingClientRect();

  if (event.clientX < shellRect.left + viewportEdge) {
    gridShell.scrollLeft -= 12;
  } else if (event.clientX > shellRect.right - viewportEdge) {
    gridShell.scrollLeft += 12;
  }
}

function handleRecordDragMove(event) {
  const session = recordDragSession;
  if (!session) return;

  if (!session.active) {
    const distance = Math.hypot(
      event.clientX - session.sourceX,
      event.clientY - session.sourceY
    );
    if (distance < 5) return;
    activateRecordDrag(session);
  }

  event.preventDefault();
  autoScrollTimelineDuringDrag(event);
  const target = document.elementFromPoint(event.clientX, event.clientY);
  const targetTrack = target?.closest(".day-track");
  if (!targetTrack) {
    session.validTarget = false;
    session.preview.classList.add("hidden");
    return;
  }

  const durationMinutes = Math.max(
    GRID_CREATE_SNAP_MINUTES,
    (session.groupEnd - session.groupStart) / 60000
  );
  const rawStart = rawPointerMinutesInTrack(
    event,
    targetTrack,
    session.range,
    session.rowHeight
  ) - session.grabOffsetMinutes;
  const maxStart = Math.max(
    session.range.start,
    session.range.end - durationMinutes
  );
  const startMinutes = Math.max(
    session.range.start,
    Math.min(maxStart, snapGridMinutes(rawStart))
  );
  const top = ((startMinutes - session.range.start) / 30) * session.rowHeight + 2;
  const height = Math.max(
    7,
    (durationMinutes / 30) * session.rowHeight - 4
  );

  session.validTarget = true;
  session.targetDateKey = targetTrack.dataset.dateKey;
  session.targetStartMinutes = startMinutes;
  session.preview.classList.remove("hidden");
  session.preview.style.top = `${top}px`;
  session.preview.style.height = `${height}px`;
  targetTrack.appendChild(session.preview);

  const title = session.preview.querySelector(".record-title");
  if (title) {
    title.textContent =
      `${session.targetDateKey} ${minutesToTimeValue(startMinutes)} · ${getGridBlockTitle(session.displayRecord)}`;
  }
}

function cleanupRecordDrag() {
  if (!recordDragSession) return;
  recordDragSession.preview?.remove();
  recordDragSession.block?.classList.remove("dragging-source");
  recordDragSession = null;
  document.body.classList.remove("record-dragging");
  window.removeEventListener("pointermove", handleRecordDragMove);
  window.removeEventListener("pointerup", handleRecordDragEnd);
  window.removeEventListener("pointercancel", cancelRecordDrag);
}

function cancelRecordDrag() {
  cleanupRecordDrag();
}

async function handleRecordDragEnd() {
  const session = recordDragSession;
  if (!session) return;

  if (!session.active) {
    cleanupRecordDrag();
    return;
  }

  suppressGridBlockClickUntil = Date.now() + 300;
  const shouldMove = session.validTarget;
  const targetDateKey = session.targetDateKey;
  const targetStartMinutes = session.targetStartMinutes;
  const memberKeys = new Set(
    session.members.map((record) => `${record.dateKey}|${record.id}`)
  );
  const targetStart = shouldMove
    ? timeToTimestamp(minutesToTimeValue(targetStartMinutes), targetDateKey)
    : null;
  const deltaMs = targetStart == null ? 0 : targetStart - session.groupStart;
  cleanupRecordDrag();

  if (!shouldMove || deltaMs === 0) return;

  records = records.map((record) => {
    if (!memberKeys.has(`${record.dateKey}|${record.id}`)) return record;
    const start = Number(record.start) + deltaMs;
    const end = record.end == null ? null : Number(record.end) + deltaMs;
    return {
      ...record,
      start,
      end,
      dateKey: dateKeyFromTimestamp(start),
    };
  });

  await persistWeekRecords();
  setBackupStatus(
    `已移动 ${session.members.length > 1 ? `${session.members.length} 个连续时间块` : "时间块"}到 ${targetDateKey} ${minutesToTimeValue(targetStartMinutes)}。`
  );
}

function openTimelineContextMenu(event, displayRecord) {
  event.preventDefault();
  event.stopPropagation();
  hideTimelineTooltip();

  contextMenuRecord = displayRecord;
  const members = getDisplayRecordMembers(displayRecord);
  const ongoing = isDisplayRecordOngoing(displayRecord);
  const autoFilled = isDisplayRecordAutoFilled(displayRecord);
  const copyButton = timelineContextMenu.querySelector('[data-action="copy"]');
  const deleteButton = timelineContextMenu.querySelector('[data-action="delete"]');
  const startButton = timelineContextMenu.querySelector('[data-action="start-pomodoro"]');

  timelineContextMenuTitle.textContent =
    members.length > 1
      ? `${getRecordLabel(displayRecord)} · ${members.length} 个连续块`
      : getRecordLabel(displayRecord);
  copyButton.disabled = autoFilled;
  copyButton.title = autoFilled ? "自动补全的未记录时间不能复制" : "";
  deleteButton.disabled = ongoing || autoFilled;
  deleteButton.title = ongoing
    ? "正在进行的记录请先停止番茄钟"
    : autoFilled
      ? "自动补全的未记录时间不能单独删除"
      : "";
  startButton.disabled = autoFilled || ongoing;
  startButton.title = autoFilled ? "自动补全时间不能启动番茄钟" : ongoing ? "正在进行的记录不能重复启动" : "使用该时间块标题开始新的番茄钟";

  timelineContextMenu.classList.remove("hidden");
  timelineContextMenu.style.left = `${event.clientX}px`;
  timelineContextMenu.style.top = `${event.clientY}px`;

  requestAnimationFrame(() => {
    const rect = timelineContextMenu.getBoundingClientRect();
    const margin = 8;
    timelineContextMenu.style.left =
      `${Math.max(margin, Math.min(event.clientX, window.innerWidth - rect.width - margin))}px`;
    timelineContextMenu.style.top =
      `${Math.max(margin, Math.min(event.clientY, window.innerHeight - rect.height - margin))}px`;
  });
}

function hideTimelineContextMenu() {
  timelineContextMenu.classList.add("hidden");
  contextMenuRecord = null;
}

async function handleTimelineContextMenuAction(event) {
  const button = event.target.closest("button[data-action]");
  if (!button || button.disabled || !contextMenuRecord) return;

  const displayRecord = contextMenuRecord;
  const action = button.dataset.action;
  hideTimelineContextMenu();

  if (action === "copy") {
    await copyDisplayRecord(displayRecord);
  } else if (action === "delete") {
    await deleteDisplayRecord(displayRecord);
  } else if (action === "start-pomodoro") {
    await startPomodoroFromRecord(displayRecord);
  }
}

async function startPomodoroFromRecord(displayRecord) {
  const member = getDisplayRecordMembers(displayRecord)[0] || displayRecord;
  const controller = document.getElementById("pomodoroFrame")?.contentWindow?.MinimalPomodoroController;
  if (!controller?.startTodoInPip) {
    setBackupStatus("番茄钟控制器尚未准备好，请稍后重试。");
    return;
  }
  try {
    const started = await controller.startTodoInPip({
      id: `record:${member.id}`,
      title: member.content || "工作",
      date: member.dateKey,
      plannedStart: new Date(member.start).toISOString(),
      plannedEnd: member.end ? new Date(member.end).toISOString() : "",
    });
    setBackupStatus(started ? `已开始同标题番茄钟：${member.content || "工作"}` : `已载入番茄钟：${member.content || "工作"}`);
    if (!recordEditorOverlay.classList.contains("hidden")) closeRecordEditor();
  } catch (error) {
    setBackupStatus(error?.message || "无法启动番茄钟。");
  }
}

async function copyDisplayRecord(displayRecord) {
  const members = getDisplayRecordMembers(displayRecord)
    .sort((a, b) => a.start - b.start);
  if (!members.length) return;

  const groupStart = Number(members[0].start);
  const groupEnd = Math.max(
    ...members.map((record) => Number(record.end || Date.now()))
  );
  const groupDurationMs = Math.max(
    GRID_CREATE_SNAP_MINUTES * 60000,
    groupEnd - groupStart
  );
  const gapMs = GRID_CREATE_SNAP_MINUTES * 60000;
  const endOfDay = timeToTimestamp("23:59", members[0].dateKey) + 60 * 1000;
  const startOfDay = timeToTimestamp("00:00", members[0].dateKey);
  let offsetMs = groupDurationMs + gapMs;

  if (groupEnd + offsetMs > endOfDay) {
    offsetMs = -(groupDurationMs + gapMs);
  }
  if (groupStart + offsetMs < startOfDay) {
    offsetMs = 0;
  }

  const copies = members.map((record) => {
    const start = Number(record.start) + offsetMs;
    const sourceEnd = record.end == null ? Date.now() : Number(record.end);
    return {
      ...record,
      id: createId(),
      dateKey: dateKeyFromTimestamp(start),
      start,
      end: sourceEnd + offsetMs,
      reviewPending: false,
      reviewSkipped: false,
      completion: "",
      focus: "",
      interruption: "",
      reviewNote: "",
      completedNaturally: undefined,
      completionReason: "manual_copy",
      expired: false,
      automatic: false,
      todoAutoCompleteEligible: false,
      autoFilled: false,
      inferredStart: false,
      interruptions: [],
    };
  });

  records.push(...copies);
  await persistWeekRecords();
  setBackupStatus(
    `已复制 ${copies.length > 1 ? `${copies.length} 个连续时间块` : "时间块"}，可直接拖动到合适位置。`
  );
}

async function deleteDisplayRecord(displayRecord) {
  const members = getDisplayRecordMembers(displayRecord);
  if (!members.length || isDisplayRecordOngoing(displayRecord) || isDisplayRecordAutoFilled(displayRecord)) {
    return;
  }

  const message = members.length > 1
    ? `确认删除这组连续记录吗？共 ${members.length} 个时间块。`
    : `确认删除这个时间块吗？\n${displayRecord.dateKey} ${formatTime(displayRecord.start)}-${formatTime(displayRecord.end || Date.now())} ${getRecordLabel(displayRecord)}`;
  if (!confirm(message)) return;

  const memberKeys = new Set(
    members.map((record) => `${record.dateKey}|${record.id}`)
  );
  await markRecordsDeletedForNotion(members);
  const editingKey = `${recordDateKey.value}|${recordId.value}`;
  records = records.filter(
    (record) => !memberKeys.has(`${record.dateKey}|${record.id}`)
  );
  await persistWeekRecords();

  if (!recordEditorOverlay.classList.contains("hidden")) closeRecordEditor();
  if (memberKeys.has(editingKey)) resetForm();
  setBackupStatus(
    `已删除 ${members.length > 1 ? `${members.length} 个连续时间块` : "时间块"}。`
  );
}

function snapGridMinutes(value) {
  return Math.round(value / GRID_CREATE_SNAP_MINUTES) * GRID_CREATE_SNAP_MINUTES;
}

function clampGridMinutes(value, range) {
  return Math.max(range.start, Math.min(range.end, value));
}

function pointerMinutesInTrack(event, track, range, rowHeight) {
  const rect = track.getBoundingClientRect();
  const y = Math.max(0, Math.min(rect.height, event.clientY - rect.top));
  const minutes = range.start + (y / rowHeight) * 30;
  return clampGridMinutes(snapGridMinutes(minutes), range);
}

function minutesToTimeValue(totalMinutes) {
  const safe = Math.max(0, Math.min(24 * 60 - 1, Math.round(totalMinutes)));
  const hour = Math.floor(safe / 60);
  const minute = safe % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function updateGridDraftBlock(session, currentMinutes) {
  const start = Math.min(session.anchorMinutes, currentMinutes);
  let end = Math.max(session.anchorMinutes, currentMinutes);

  if (end - start < GRID_CREATE_SNAP_MINUTES) {
    end = Math.min(session.range.end, start + GRID_CREATE_DEFAULT_MINUTES);
  }

  const top = ((start - session.range.start) / 30) * session.rowHeight;
  const height = Math.max(
    8,
    ((end - start) / 30) * session.rowHeight
  );

  session.startMinutes = start;
  session.endMinutes = end;
  session.draft.style.top = `${top}px`;
  session.draft.style.height = `${height}px`;
  session.draft.querySelector(".record-title").textContent =
    `${minutesToTimeValue(start)}-${minutesToTimeValue(end)} 新建时间块`;
}

function cancelGridTimeBlockCreation() {
  if (!gridCreateSession) return;
  gridCreateSession.draft?.remove();
  gridCreateSession = null;
  window.removeEventListener("pointermove", handleGridCreateMove);
  window.removeEventListener("pointerup", handleGridCreateEnd);
  window.removeEventListener("pointercancel", cancelGridTimeBlockCreation);
}

function handleGridCreateMove(event) {
  if (!gridCreateSession) return;
  const currentMinutes = pointerMinutesInTrack(
    event,
    gridCreateSession.track,
    gridCreateSession.range,
    gridCreateSession.rowHeight
  );
  updateGridDraftBlock(gridCreateSession, currentMinutes);
}

function handleGridCreateEnd(event) {
  if (!gridCreateSession) return;

  const session = gridCreateSession;
  const currentMinutes = pointerMinutesInTrack(
    event,
    session.track,
    session.range,
    session.rowHeight
  );
  updateGridDraftBlock(session, currentMinutes);

  const startMinutes = session.startMinutes;
  const endMinutes = session.endMinutes;
  cancelGridTimeBlockCreation();
  openNewRecordFromGrid(session.dateKey, startMinutes, endMinutes);
}

function beginGridTimeBlockCreation(event, track, dateKey, range, rowHeight) {
  if (event.button !== 0) return;
  if (event.target.closest(".record")) return;
  if (gridCreateSession) cancelGridTimeBlockCreation();

  event.preventDefault();
  hideTimelineTooltip();

  const anchorMinutes = pointerMinutesInTrack(event, track, range, rowHeight);
  const draft = document.createElement("div");
  draft.className = "record work grid-draft";
  draft.innerHTML = `<span class="record-title"></span>`;
  draft.style.left = "6px";
  draft.style.width = "calc(100% - 12px)";
  track.appendChild(draft);

  gridCreateSession = {
    track,
    dateKey,
    range,
    rowHeight,
    anchorMinutes,
    startMinutes: anchorMinutes,
    endMinutes: Math.min(range.end, anchorMinutes + GRID_CREATE_DEFAULT_MINUTES),
    draft,
  };

  updateGridDraftBlock(gridCreateSession, anchorMinutes);
  window.addEventListener("pointermove", handleGridCreateMove);
  window.addEventListener("pointerup", handleGridCreateEnd, { once: true });
  window.addEventListener("pointercancel", cancelGridTimeBlockCreation, { once: true });
}

function openNewRecordFromGrid(dateKey, startMinutes, endMinutes) {
  editorTitle.textContent = "新增时间块";
  recordId.value = "";
  recordDateKey.value = "";
  recordDate.value = dateKey;
  recordType.value = "work";
  recordContent.value = "";
  recordStart.value = minutesToTimeValue(startMinutes);
  recordEnd.value = minutesToTimeValue(endMinutes);
  recordRound.value = "";
  deleteEditingBtn.disabled = true;

  renderList();
  openRecordEditor({ focusContent: true });
  setBackupStatus(
    `已选择 ${minutesToTimeValue(startMinutes)}-${minutesToTimeValue(endMinutes)}，填写内容后保存。`
  );
  requestAnimationFrame(() => recordContent.focus());
}

function renderText(options = {}) {
  if (!weekFlowGrid) return;
  const displayRecords = getDisplayRecords(records);
  const days = weekDates();
  weekFlowGrid.innerHTML = days.map((date) => flowDayCardHtml(date, displayRecords)).join("");

  window.dispatchEvent(new CustomEvent("minimal-pomodoro-week-flow-rendered", {
    detail: {
      dateKeys: days.map(toDateKey),
      remote: options.planningRemote === true,
    },
  }));
}

function flowDayCardHtml(date, displayRecords, extraClass = "") {
    const dateKey = toDateKey(date);
    const dayRecords = displayRecords.filter((record) => record.dateKey === dateKey);
    const today = todayKey();
    let tomato = 0;
    const timelineItems = dayRecords.map((record) => {
      let label = getTextLabel(record, tomato);
      if (record.type === "work") {
        const first = tomato + 1;
        tomato += record.mergedCount || 1;
        label = first === tomato
          ? `🍅${first}：${record.content || "工作"}`
          : `🍅${first}-${tomato}：${record.content || "工作"}`;
      }
      const sourceRecords = record.mergedRecords?.length ? record.mergedRecords : [record];
      const primaryRecord = sourceRecords[0];
      const reviewText = record.type === "work" ? compactReviewText(record) : "";
      return `
        <div class="flow-record flow-record-${escapeHtml(record.type)}" role="button" tabindex="0"
          data-date-key="${escapeHtml(dateKey)}"
          data-record-id="${escapeHtml(primaryRecord.id)}"
          data-merged-ids="${escapeHtml(sourceRecords.map((item) => item.id).join(","))}"
          title="点击查看或编辑记录">
          <time>${formatTime(record.start)}–${formatTime(record.end || Date.now())}</time>
          <strong>${escapeHtml(label)}</strong>
          <small>${formatCompactDurationFromMs(durationMs(record))}</small>
          ${reviewText ? `<span class="flow-record-review">${escapeHtml(reviewText)}</span>` : ""}
        </div>`;
    }).join("");

    return `
      <article class="flow-day-card${dateKey === today ? " is-today" : ""}${extraClass ? ` ${extraClass}` : ""}" data-flow-date="${dateKey}" aria-selected="false">
        <header class="flow-day-head">
          <div><span>${weekdayName(date)}</span><strong>${date.getMonth() + 1}/${date.getDate()}</strong></div>
          ${dateKey === today ? '<em>今天</em>' : ""}
        </header>
        <section class="flow-section flow-todo-section">
          <div class="flow-section-head">
            <h3>待办</h3>
            <div class="flow-compact-actions">
              <button type="button" data-flow-action="new-todo">新增</button>
              <button type="button" data-flow-action="sync-day">同步</button>
              <button type="button" data-flow-action="generate-todos">LLM 生成待办</button>
            </div>
          </div>
          <div class="flow-todo-list" data-flow-role="todos"><div class="flow-empty">等待读取 Notion 待办</div></div>
        </section>

        <section class="flow-section flow-timeline-section">
          <div class="flow-section-head"><h3>时间流</h3><span>${dayRecords.length} 条记录</span></div>
          <div class="flow-record-list">${timelineItems || '<div class="flow-empty">当天还没有时间记录</div>'}</div>
        </section>

        <section class="flow-section flow-completion-section">
          <div class="flow-section-head"><h3>完成情况</h3><span>由你填写</span></div>
          <textarea data-flow-role="completion" rows="5" placeholder="写明完成了什么、未完成什么及原因。"></textarea>
          <button class="flow-secondary-action" type="button" data-flow-action="save-completion">保存完成情况</button>
          <small class="flow-save-state" data-flow-role="completion-status" data-state="idle" role="status" aria-live="polite">修改后请点击保存，内容将写入 Notion</small>
        </section>

        <section class="flow-section flow-inspiration-section">
          <div class="flow-section-head"><h3>灵感记录</h3><span>每日速记</span></div>
          <textarea data-flow-role="inspiration" data-date-key="${escapeHtml(dateKey)}" rows="4" placeholder="记录今天冒出来的想法、线索、问题或下一步实验。">${escapeHtml(inspirationsByDate[dateKey] || "")}</textarea>
          <small class="flow-save-state" data-flow-role="inspiration-status" data-state="idle" role="status" aria-live="polite">输入后自动保存到本地</small>
        </section>

        <section class="flow-section flow-review-section">
          <div class="flow-section-head"><h3>当天总结</h3><span>LLM 生成</span></div>
          <div class="flow-review-content" data-flow-role="review"><div class="flow-empty">尚未生成总结</div></div>
          <div class="flow-review-actions">
            <button class="flow-primary-action" type="button" data-flow-action="generate-review">生成总结与次日待办</button>
            <button class="flow-secondary-action" type="button" data-flow-action="update-archive">更新每日归档</button>
            <button class="flow-secondary-action" type="button" data-flow-action="export-day-md">导出 MD</button>
          </div>
        </section>
      </article>`;
}

function renderInspirations() {
  if (!inspirationBoard) return;
  const days = weekDates();
  const cards = days.map((date) => {
    const dateKey = toDateKey(date);
    const text = normalizeInspirationText(inspirationsByDate[dateKey]);
    const lines = splitInspirationLines(text);
    return `
      <article class="inspiration-card${text ? "" : " is-empty"}" data-flow-date="${escapeHtml(dateKey)}">
        <header>
          <div><span>${escapeHtml(weekdayName(date))}</span><strong>${escapeHtml(formatMonthDay(date))}</strong></div>
          <time>${escapeHtml(dateKey)}</time>
        </header>
        <textarea data-flow-role="inspiration" data-date-key="${escapeHtml(dateKey)}" rows="5" placeholder="今天有什么新想法？">${escapeHtml(text)}</textarea>
        <div class="inspiration-preview">
          ${lines.length
            ? `<ul>${lines.map((line) => `<li>${escapeHtml(line)}</li>`).join("")}</ul>`
            : '<div class="flow-empty">这一天还没有灵感记录</div>'}
        </div>
        <small class="flow-save-state" data-flow-role="inspiration-status" data-state="idle" role="status" aria-live="polite">自动保存</small>
      </article>`;
  }).join("");
  inspirationBoard.innerHTML = cards;
}

function handleFlowInspirationInput(event) {
  const input = event.target.closest('textarea[data-flow-role="inspiration"][data-date-key]');
  if (!input) return;
  const dateKey = input.dataset.dateKey;
  inspirationsByDate[dateKey] = input.value;
  setInspirationSaveState(dateKey, "dirty", "正在保存…");
  clearTimeout(inspirationSaveTimer);
  inspirationSaveTimer = setTimeout(() => saveInspiration(dateKey, input.value), 350);
}

async function saveInspiration(dateKey, text) {
  const value = normalizeInspirationText(text);
  try {
    await chrome.storage.local.set({ [inspirationStorageKey(dateKey)]: value });
    inspirationsByDate[dateKey] = value;
    setInspirationSaveState(dateKey, "saved", "已自动保存");
    updateInspirationTextareas(dateKey, value);
    updateInspirationPreview(dateKey, value);
  } catch (error) {
    setInspirationSaveState(dateKey, "error", error?.message || "保存失败");
  }
}

function setInspirationSaveState(dateKey, state, text) {
  for (const status of document.querySelectorAll(`[data-flow-date="${CSS.escape(dateKey)}"] [data-flow-role="inspiration-status"]`)) {
    status.dataset.state = state;
    status.textContent = text;
  }
}

function updateInspirationTextareas(dateKey, value) {
  for (const textarea of document.querySelectorAll(`textarea[data-flow-role="inspiration"][data-date-key="${CSS.escape(dateKey)}"]`)) {
    if (document.activeElement !== textarea) textarea.value = value;
  }
}

function updateInspirationPreview(dateKey, value) {
  const card = inspirationBoard?.querySelector(`.inspiration-card[data-flow-date="${CSS.escape(dateKey)}"]`);
  if (!card) return;
  const lines = splitInspirationLines(value);
  card.classList.toggle("is-empty", !normalizeInspirationText(value));
  const preview = card.querySelector(".inspiration-preview");
  if (!preview) return;
  preview.innerHTML = lines.length
    ? `<ul>${lines.map((line) => `<li>${escapeHtml(line)}</li>`).join("")}</ul>`
    : '<div class="flow-empty">这一天还没有灵感记录</div>';
}

function splitInspirationLines(text) {
  return normalizeInspirationText(text)
    .split(/\n+/)
    .map((line) => line.replace(/^[-*]\s*/, "").trim())
    .filter(Boolean)
    .slice(0, 8);
}

function renderToday() {
  if (!todayTimelineGrid || !todayFlowGrid) return;
  const date = new Date(selectedTodayDate);
  const dateKey = toDateKey(date);
  const displayRecords = getDisplayRecords(records);
  todayFlowGrid.innerHTML = flowDayCardHtml(date, displayRecords, "today-flow-card");

  const timeColumn = timelineGrid.querySelector(".time-col");
  const todayColumn = timelineGrid.querySelector(`.day-col[data-date-key="${dateKey}"]`);
  todayTimelineGrid.innerHTML = "";
  todayTimelineGrid.dataset.rangeStart = timelineGrid.dataset.rangeStart || "";
  todayTimelineGrid.dataset.rangeEnd = timelineGrid.dataset.rangeEnd || "";
  todayTimelineGrid.dataset.rowHeight = timelineGrid.dataset.rowHeight || "";
  if (!timeColumn || !todayColumn) {
    todayTimelineGrid.innerHTML = '<div class="today-empty">当天时间块正在准备中…</div>';
    return;
  }
  todayTimelineGrid.append(timeColumn.cloneNode(true), todayColumn.cloneNode(true));
  updateCurrentTimeIndicator();
  if (todayFocusPending && !todayView.classList.contains("hidden")) {
    todayFocusPending = false;
    requestAnimationFrame(focusTodayCurrentTime);
  }
  window.dispatchEvent(new CustomEvent("minimal-pomodoro-today-date-rendered", {
    detail: { dateKey },
  }));
}

function focusTodayCurrentTime() {
  const shell = todayTimelineGrid.closest(".today-grid-shell");
  const line = todayTimelineGrid.querySelector(".current-time-line:not(.hidden)");
  if (!shell || !line) return;
  shell.scrollTo({ top: Math.max(0, line.offsetTop - shell.clientHeight * 0.32), behavior: "smooth" });
}

function todayGridRecord(target) {
  const block = target.closest(".record[data-record-id]");
  if (!block || block.dataset.autoFilled === "true") return { block, record: null, displayRecord: null };
  const dateKey = block.dataset.dateKey;
  const id = block.dataset.recordId;
  const record = records.find((item) => item.dateKey === dateKey && item.id === id) || null;
  const mergedIds = new Set(String(block.dataset.mergedIds || id).split(",").filter(Boolean));
  const displayRecord = getDisplayRecords(records).find((item) => {
    const members = item.mergedRecords?.length ? item.mergedRecords : [item];
    return item.dateKey === dateKey && members.some((member) => mergedIds.has(member.id));
  }) || record;
  return { block, record, displayRecord };
}

function handleTodayGridClick(event) {
  if (Date.now() < suppressGridBlockClickUntil) return;
  const planned = event.target.closest(".planned-todo-block[data-todo-id]");
  if (planned) {
    const dateKey = planned.dataset.dateKey;
    const todo = (gridTodosByDate.get(dateKey) || []).find((item) => item.id === planned.dataset.todoId);
    if (todo) window.dispatchEvent(new CustomEvent("minimal-pomodoro-open-grid-todo", { detail: { dateKey, todoId: todo.id, todo } }));
    return;
  }
  const { block, record } = todayGridRecord(event.target);
  if (!block || !record) return;
  hideTimelineTooltip();
  const mergedIds = String(block.dataset.mergedIds || record.id).split(",").filter(Boolean);
  fillForm(record.dateKey, record.id);
  if (mergedIds.length > 1) highlightMergedRecordGroup(record.dateKey, new Set(mergedIds));
}

function handleTodayGridPointerDown(event) {
  if (event.button !== 0) return;
  const { block, record, displayRecord } = todayGridRecord(event.target);
  const range = {
    start: Number(todayTimelineGrid.dataset.rangeStart),
    end: Number(todayTimelineGrid.dataset.rangeEnd),
  };
  const rowHeight = Number(todayTimelineGrid.dataset.rowHeight);
  if (!Number.isFinite(range.start) || !Number.isFinite(range.end) || !Number.isFinite(rowHeight)) return;
  if (block && record) {
    beginRecordDrag(event, block, displayRecord || record, range, rowHeight);
    return;
  }
  if (block) return;
  const track = event.target.closest(".day-track[data-date-key]");
  if (track) beginGridTimeBlockCreation(event, track, track.dataset.dateKey, range, rowHeight);
}

function handleTodayGridContextMenu(event) {
  const { displayRecord } = todayGridRecord(event.target);
  if (displayRecord) openTimelineContextMenu(event, displayRecord);
}

function handleTodayGridPointerOver(event) {
  const { displayRecord } = todayGridRecord(event.target);
  if (displayRecord) showTimelineTooltip(event, displayRecord);
}

function centerTodayInHorizontalView(mode, { behavior = "auto" } = {}) {
  const shell = mode === "text"
    ? weekFlowGrid?.closest(".week-flow-shell")
    : timelineGrid?.closest(".grid-shell");
  const target = mode === "text"
    ? weekFlowGrid?.querySelector(`[data-flow-date="${todayKey()}"]`)
    : timelineGrid?.querySelector(".day-col.today");
  if (!shell || !target) return false;
  const targetLeft = target.offsetLeft + target.offsetWidth / 2 - shell.clientWidth / 2;
  shell.scrollTo({ left: Math.max(0, targetLeft), behavior });
  target.classList.remove("today-center-pulse");
  requestAnimationFrame(() => target.classList.add("today-center-pulse"));
  return true;
}

function visibleHistoryMode() {
  if (!gridView.classList.contains("hidden")) return "grid";
  if (!textView.classList.contains("hidden")) return "text";
  return "";
}

function scheduleVisibleHistoryTodayFocus(options) {
  const mode = visibleHistoryMode();
  if (mode) scheduleHistoryTodayFocus(mode, options);
}

function scheduleHistoryTodayFocus(mode, { behavior = "auto" } = {}) {
  if (!isSameWeek(currentWeekStart, new Date())) return;
  const request = ++historyTodayFocusRequest;
  // Wait for both the selected view and its horizontal scroller to finish
  // layout. A single frame is insufficient when the history sub-view has just
  // changed from display:none.
  requestAnimationFrame(() => requestAnimationFrame(() => {
    if (request !== historyTodayFocusRequest || visibleHistoryMode() !== mode) return;
    centerTodayInHorizontalView(mode, { behavior });
  }));
}

function formatTextDaySummary(dayRecords) {
  const totals = {
    total: 0,
    work: 0,
    break: 0,
    life: 0,
    entertainment: 0,
    unrecorded: 0,
  };

  for (const record of dayRecords) {
    const minutes = recordStatsMinutes(record);
    totals.total += minutes;

    if (record.autoFilled) {
      totals.unrecorded += minutes;
    } else if (record.type === "work") {
      totals.work += minutes;
    } else if (record.type === "break") {
      totals.break += minutes;
    } else if (record.type === "life") {
      totals.life += minutes;
    } else if (record.type === "entertainment") {
      totals.entertainment += minutes;
    }
  }

  const workRatio = totals.total > 0 ? Math.round((totals.work / totals.total) * 100) : 0;
  const parts = [
    `记录${formatDuration(totals.total)}`,
    `工作${formatDuration(totals.work)}`,
    `工作占比${workRatio}%`,
    `休息${formatDuration(totals.break)}`,
    `生活${formatDuration(totals.life)}`,
    `娱乐${formatDuration(totals.entertainment)}`,
  ];

  if (totals.unrecorded > 0) {
    parts.push(`未记录${formatDuration(totals.unrecorded)}`);
  }

  return `  小结：${parts.join(" · ")}`;
}

function renderList() {
  recordCount.textContent = `${records.length} 条`;
  if (records.length === 0) {
    recordList.innerHTML = `<div class="item"><div class="item-main"><div class="item-title">暂无记录</div><div class="item-meta">可以在左侧新增一条记录。</div></div></div>`;
    return;
  }

  const activeId = recordId.value;
  const activeDateKey = recordDateKey.value;
  const displayRecords = [...records].sort((a, b) => b.start - a.start);

  recordList.innerHTML = "";
  for (const record of displayRecords) {
    const item = document.createElement("div");
    item.className = "item";
    item.dataset.recordId = record.id;
    item.dataset.dateKey = record.dateKey;
    item.classList.toggle("editing", record.id === activeId && record.dateKey === activeDateKey);
    item.tabIndex = 0;
    item.role = "button";
    item.title = "点击选中并编辑这条记录";
    item.addEventListener("click", () => fillForm(record.dateKey, record.id));
    item.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        fillForm(record.dateKey, record.id);
      }
    });

    const main = document.createElement("div");
    main.className = "item-main";
    main.innerHTML = `
      <div class="item-title">
        <span class="pill ${record.type}">${typeName(record.type)}</span>${escapeHtml(record.content || defaultContent(record.type))}
      </div>
      <div class="item-meta">${record.dateKey} · ${formatTime(record.start)}-${formatTime(record.end || Date.now())}${record.round ? ` · 第 ${record.round} 轮` : ""}</div>
    `;

    const actions = document.createElement("div");
    actions.className = "item-actions";

    const edit = document.createElement("button");
    edit.className = "ghost";
    edit.type = "button";
    edit.textContent = record.id === activeId && record.dateKey === activeDateKey ? "编辑中" : "编辑";
    edit.addEventListener("click", (event) => {
      event.stopPropagation();
      fillForm(record.dateKey, record.id);
    });

    const del = document.createElement("button");
    del.className = "danger";
    del.type = "button";
    del.textContent = "删除";
    del.addEventListener("click", (event) => {
      event.stopPropagation();
      deleteRecord(record.dateKey, record.id);
    });

    actions.append(edit, del);
    item.append(main, actions);
    recordList.appendChild(item);
  }
}

function highlightMergedRecordGroup(dateKey, mergedIds) {
  requestAnimationFrame(() => {
    for (const item of recordList.querySelectorAll(".item")) {
      item.classList.toggle(
        "merged-highlight",
        item.dataset.dateKey === dateKey && mergedIds.has(item.dataset.recordId)
      );
    }
  });
}

function setMode(mode) {
  const today = mode === "today";
  const grid = mode === "grid";
  const text = mode === "text";
  const inspiration = mode === "inspiration";
  const phases = mode === "phases";
  const history = grid || text || inspiration || phases;
  const summary = mode === "summary";
  const notion = mode === "notion";
  document.body.classList.toggle("today-page-active", today);
  document.body.classList.toggle("history-page-active", history);
  document.body.classList.toggle("phase-plans-page-active", phases);

  if (history) lastHistoryMode = mode;

  todayMode.classList.toggle("active", today);
  recordsMode.classList.toggle("active", history);
  historyGridMode.classList.toggle("active", grid);
  historyTextMode.classList.toggle("active", text);
  historyInspirationMode?.classList.toggle("active", inspiration);
  historyPhaseMode.classList.toggle("active", phases);
  summaryMode.classList.toggle("active", summary);
  notionMode.classList.toggle("active", notion);

  pomodoroView.classList.add("hidden");
  todayView.classList.toggle("hidden", !today);
  historyView.classList.toggle("hidden", !history);
  gridView.classList.toggle("hidden", !grid);
  textView.classList.toggle("hidden", !text);
  inspirationView?.classList.toggle("hidden", !inspiration);
  phasePlansView.classList.toggle("hidden", !phases);
  summaryView.classList.toggle("hidden", !summary);
  notionView.classList.toggle("hidden", !notion);
  renderHeader();
  window.dispatchEvent(new CustomEvent("minimal-pomodoro-mode-change", { detail: { mode } }));
}

function applySummarySidebarState() {
  if (!summarySidebar || !summaryCollapseBtn) return;

  summaryView.classList.toggle("sidebar-collapsed", summarySidebarCollapsed);
  summarySidebar.classList.toggle("collapsed", summarySidebarCollapsed);
  summaryCollapseBtn.textContent = summarySidebarCollapsed ? "展开" : "收起";
  summaryCollapseBtn.setAttribute("aria-expanded", String(!summarySidebarCollapsed));
  summaryCollapseBtn.setAttribute(
    "aria-label",
    summarySidebarCollapsed ? "展开文字总结" : "收起文字总结"
  );
}

function toggleSummarySidebar() {
  summarySidebarCollapsed = !summarySidebarCollapsed;
  try {
    localStorage.setItem(
      "minimalPomodoroSummarySidebarCollapsed",
      summarySidebarCollapsed ? "1" : "0"
    );
  } catch {}
  applySummarySidebarState();
}

function restoreSummarySidebarState() {
  try {
    summarySidebarCollapsed =
      localStorage.getItem("minimalPomodoroSummarySidebarCollapsed") === "1";
  } catch {
    summarySidebarCollapsed = false;
  }
  applySummarySidebarState();
}

async function saveFormRecord(event) {
  event.preventDefault();

  const dateKey = recordDate.value;
  const start = timeToTimestamp(recordStart.value, dateKey);
  const end = timeToTimestamp(recordEnd.value, dateKey);

  if (!dateKey || !start || !end) {
    alert("请填写日期、开始时间和结束时间。");
    return;
  }

  if (end < start) {
    alert("结束时间不能早于开始时间。");
    return;
  }

  const oldDateKey = recordDateKey.value || dateKey;
  const id = recordId.value || createId();

  const existingRecord = records.find(
    (item) => item.id === id && item.dateKey === oldDateKey
  );

  const payload = {
    id,
    dateKey,
    type: recordType.value,
    content: recordContent.value.trim() || defaultContent(recordType.value),
    note: "",
    start,
    end,
    round: recordRound.value ? Number(recordRound.value) : null,
    reviewPending: recordType.value === "work"
      ? Boolean(existingRecord?.reviewPending && !recordCompletion.value && !recordFocus.value && !recordInterruption.value && !recordReviewNote.value.trim())
      : existingRecord?.reviewPending,
    reviewSkipped: recordType.value === "work"
      ? Boolean(existingRecord?.reviewSkipped && !recordCompletion.value && !recordFocus.value && !recordInterruption.value && !recordReviewNote.value.trim())
      : Boolean(existingRecord?.reviewSkipped),
    completion: recordType.value === "work" ? recordCompletion.value : (existingRecord?.completion || ""),
    focus: recordType.value === "work" ? recordFocus.value : (existingRecord?.focus || ""),
    interruption: recordType.value === "work" ? recordInterruption.value : (existingRecord?.interruption || ""),
    reviewNote: recordType.value === "work" ? recordReviewNote.value.trim() : (existingRecord?.reviewNote || ""),
    completedNaturally: existingRecord?.completedNaturally,
    completionReason: existingRecord?.completionReason || "",
    todoId: existingRecord?.todoId || "",
    todoUrl: existingRecord?.todoUrl || "",
    todoDate: existingRecord?.todoDate || "",
    todoPlannedStart: existingRecord?.todoPlannedStart || "",
    todoPlannedEnd: existingRecord?.todoPlannedEnd || "",
    expired: Boolean(existingRecord?.expired),
    automatic: existingRecord?.automatic,
    todoAutoCompleteEligible: existingRecord
      ? existingRecord.todoAutoCompleteEligible
      : false,
    inferredStart: Boolean(existingRecord?.inferredStart),
    interruptions: Array.isArray(existingRecord?.interruptions)
      ? existingRecord.interruptions
      : [],
  };

  records = records.filter((item) => !(item.id === id && item.dateKey === oldDateKey));
  records.push(payload);

  await persistWeekRecords();
  closeRecordEditor();
}

function openSupplementRecordDialog() {
  if (!supplementRecordOverlay) return;
  supplementRecordDate.value = !todayView?.classList.contains("hidden")
    ? visibleTodayDateKey()
    : toDateKey(new Date());
  supplementRecordText.value = "";
  setSupplementRecordStatus("idle", "");
  supplementRecordOverlay.classList.remove("hidden");
  requestAnimationFrame(() => supplementRecordText.focus());
}

function closeSupplementRecordDialog() {
  if (submitSupplementRecordsBtn?.disabled) return;
  supplementRecordOverlay?.classList.add("hidden");
}

function setSupplementRecordStatus(state, message) {
  if (!supplementRecordStatus) return;
  supplementRecordStatus.dataset.state = state;
  supplementRecordStatus.textContent = message;
  supplementRecordStatus.classList.toggle("hidden", !message);
}

async function submitSupplementRecords(event) {
  event.preventDefault();
  const dateKey = supplementRecordDate.value;
  const instruction = supplementRecordText.value.trim();
  const api = globalThis.MinimalPomodoroNotion;
  if (!dateKey || !instruction) {
    setSupplementRecordStatus("error", "请选择日期并描述要补充的记录。");
    return;
  }
  if (!api?.parseNaturalLanguageTimeRecords) {
    setSupplementRecordStatus("error", "自然语言补录服务尚未准备好，请刷新页面后重试。");
    return;
  }

  submitSupplementRecordsBtn.disabled = true;
  submitSupplementRecordsBtn.textContent = "正在整理…";
  setSupplementRecordStatus("working", "LLM 正在识别时间、类型和记录内容。");
  try {
    const parsed = await api.parseNaturalLanguageTimeRecords(dateKey, instruction);
    const generated = parsed.records.map((record, index) => ({
      id: `manual-backfill:${dateKey}:${Date.now().toString(36)}:${index}`,
      type: record.type,
      content: record.content,
      note: record.note || "",
      start: record.start,
      end: record.end,
      round: null,
      automatic: false,
      todoAutoCompleteEligible: false,
      source: "manual_backfill",
      reviewPending: false,
      reviewSkipped: false,
      interruptions: [],
    }));
    const key = timelineStorageKey(dateKey);
    const stored = await chrome.storage.local.get(key);
    const existing = Array.isArray(stored[key]) ? stored[key] : [];
    await chrome.storage.local.set({ [key]: [...existing, ...generated].sort((a, b) => Number(a.start) - Number(b.start)) });

    let notionMessage = "";
    try {
      const config = await api.getConfig();
      if (config.token && config.timeRecordSourceId) {
        const sync = await api.syncRecords(generated.map((record) => ({ ...record, dateKey })), { config });
        notionMessage = `，已同步 ${sync.created + sync.updated + sync.unchanged} 条到 Notion`;
      } else {
        notionMessage = "；Notion 尚未连接，记录已保存在本地";
      }
    } catch (syncError) {
      notionMessage = `；本地已保存，但 Notion 同步失败：${syncError?.message || syncError}`;
    }
    await loadRecords({ planningRemote: false });
    setBackupStatus(`已补充 ${generated.length} 条时间记录${notionMessage}。`);
    supplementRecordOverlay.classList.add("hidden");
  } catch (error) {
    setSupplementRecordStatus("error", error?.message || "无法整理这段描述，请补充更明确的时间后重试。");
  } finally {
    submitSupplementRecordsBtn.disabled = false;
    submitSupplementRecordsBtn.textContent = "整理并补入";
  }
}

function fillForm(dateKey, id) {
  const record = records.find((item) => item.id === id && item.dateKey === dateKey);
  if (!record) return;

  editorTitle.textContent = "编辑记录";
  recordId.value = record.id;
  recordDateKey.value = record.dateKey;
  recordDate.value = record.dateKey;
  recordType.value = record.type || "work";
  recordContent.value = record.content || "";
  recordStart.value = timestampToTime(record.start);
  recordEnd.value = timestampToTime(record.end || record.start);
  recordRound.value = record.round || "";
  recordCompletion.value = record.completion || "";
  recordFocus.value = record.focus || "";
  recordInterruption.value = record.interruption || "";
  recordReviewNote.value = record.reviewNote || "";
  syncRecordReviewFieldVisibility();
  deleteEditingBtn.disabled = false;
  startRecordPomodoroBtn.disabled = false;
  renderList();
  openRecordEditor({
    focusContent: true,
    showList: recordEditorOverlay.classList.contains("list-visible"),
  });
}

function resetForm() {
  editorTitle.textContent = "新增记录";
  recordId.value = "";
  recordDateKey.value = "";
  recordDate.value = toDateKey(new Date());
  recordType.value = "work";
  recordContent.value = "";
  recordStart.value = timestampToTime(Date.now());
  recordEnd.value = timestampToTime(Date.now() + 25 * 60 * 1000);
  recordRound.value = "";
  recordCompletion.value = "";
  recordFocus.value = "";
  recordInterruption.value = "";
  recordReviewNote.value = "";
  syncRecordReviewFieldVisibility();
  deleteEditingBtn.disabled = true;
  startRecordPomodoroBtn.disabled = true;
  renderList();
}

async function startPomodoroFromEditingRecord() {
  const record = records.find((item) => item.id === recordId.value && item.dateKey === recordDateKey.value);
  if (!record) return;
  await startPomodoroFromRecord(record);
}

async function deleteRecord(dateKey, id) {
  const record = records.find((item) => item.id === id && item.dateKey === dateKey);
  if (!record) return;

  const ok = confirm(`确认删除这条记录？\n${record.dateKey} ${formatTime(record.start)}-${formatTime(record.end || Date.now())} ${record.content || defaultContent(record.type)}`);
  if (!ok) return;

  await markRecordsDeletedForNotion([record]);
  records = records.filter((item) => !(item.id === id && item.dateKey === dateKey));
  await persistWeekRecords();
  closeRecordEditor();
  resetForm();
}

async function markRecordsDeletedForNotion(items) {
  const api = globalThis.MinimalPomodoroNotion;
  const deletionKey = api?.DELETED_RECORDS_KEY || "minimalPomodoroDeletedTimeRecords";
  const syncMapKey = api?.SYNC_MAP_KEY || "minimalPomodoroNotionSyncMap";
  const stored = await chrome.storage.local.get([deletionKey, syncMapKey]);
  const deletions = { ...(stored[deletionKey] || {}) };
  const syncMaps = stored[syncMapKey] || {};
  for (const record of items) {
    const recordIdValue = String(record?.id || `${record?.dateKey || ""}:${record?.start}:${record?.type || "work"}`);
    let pageId = "";
    for (const sourceMap of Object.values(syncMaps)) {
      if (sourceMap?.[recordIdValue]?.pageId) {
        pageId = sourceMap[recordIdValue].pageId;
        break;
      }
    }
    deletions[recordIdValue] = { pageId, deletedAt: new Date().toISOString() };
  }
  await chrome.storage.local.set({ [deletionKey]: deletions });
}


function setBackupStatus(message) {
  if (!backupStatus) return;
  backupStatus.textContent = message || "";
  if (message) {
    setTimeout(() => {
      if (backupStatus.textContent === message) {
        backupStatus.textContent = "";
      }
    }, 6500);
  }
}



function recordStatsMinutes(record) {
  const start = Number(record?.start);
  if (!Number.isFinite(start)) return 0;

  const end = recordStatsEndTimestamp(record, start);
  return Math.max(0, (end - start) / 60000);
}

function recordStatsEndTimestamp(record, startTimestamp = Number(record?.start)) {
  const start = Number(startTimestamp);
  if (!Number.isFinite(start)) return 0;

  let end = Number(record?.end);
  if (!Number.isFinite(end) || end <= 0) {
    end = record?.dateKey === todayKey() ? Date.now() : start;
  }

  return Math.max(start, end);
}

function getRecordCoverage(source) {
  const byDate = new Map();

  for (const record of source) {
    if (!record?.dateKey) continue;
    const dayRecords = byDate.get(record.dateKey) || [];
    dayRecords.push(record);
    byDate.set(record.dateKey, dayRecords);
  }

  let totalRangeMinutes = 0;
  let unrecordedMinutes = 0;
  let assessableDays = 0;

  for (const [dateKey, dayRecords] of byDate.entries()) {
    const realRecords = dayRecords
      .filter((record) => (
        !record.autoFilled &&
        Number.isFinite(Number(record.start)) &&
        Number.isFinite(Number(record.end)) &&
        Number(record.end) > Number(record.start)
      ))
      .sort((a, b) => a.start - b.start);

    if (realRecords.length < 2) continue;

    const boundaryStart = parseDateKey(dateKey);
    boundaryStart.setHours(9, 0, 0, 0);
    const boundaryEnd = parseDateKey(dateKey);
    boundaryEnd.setHours(22, 0, 0, 0);
    const firstStart = Number(realRecords[0].start);
    const lastEnd = realRecords.reduce(
      (latest, record) => Math.max(latest, Number(record.end) || Number(record.start)),
      firstStart
    );
    const rangeStart = Math.max(boundaryStart.getTime(), firstStart);
    const rangeEnd = Math.min(boundaryEnd.getTime(), lastEnd);
    if (rangeEnd <= rangeStart) continue;

    const rangeMinutes = (rangeEnd - rangeStart) / 60000;
    const dayUnrecorded = dayRecords
      .filter((record) => record.autoFilled)
      .reduce((sum, record) => sum + recordStatsMinutes(record), 0);

    totalRangeMinutes += rangeMinutes;
    unrecordedMinutes += Math.min(rangeMinutes, dayUnrecorded);
    assessableDays += 1;
  }

  if (totalRangeMinutes <= 0) {
    return { available: false, ratio: 0, days: 0 };
  }

  return {
    available: true,
    ratio: Math.max(
      0,
      Math.min(100, Math.round(((totalRangeMinutes - unrecordedMinutes) / totalRangeMinutes) * 100))
    ),
    days: assessableDays,
  };
}

function recordsInWeek(source, weekStart) {
  const startKey = toDateKey(weekStart);
  const nextWeek = new Date(weekStart);
  nextWeek.setDate(nextWeek.getDate() + 7);
  const endKey = toDateKey(nextWeek);
  return source.filter((record) => record.dateKey >= startKey && record.dateKey < endKey);
}

function getSixWeekSummaries() {
  const summaries = [];

  for (let offset = 5; offset >= 0; offset -= 1) {
    const start = new Date(currentWeekStart);
    start.setDate(start.getDate() - offset * 7);
    const workRecords = recordsInWeek(historicalRecords, start)
      .filter((record) => record.type === "work");
    const minutes = workRecords.reduce((sum, record) => sum + recordStatsMinutes(record), 0);
    const isSelectedWeek = offset === 0;
    const label = isSelectedWeek && isSameWeek(currentWeekStart, new Date())
      ? "本周"
      : `${start.getMonth() + 1}/${start.getDate()}`;

    summaries.push({ start, label, minutes });
  }

  return summaries;
}

function getHistoricalWeekSummaries() {
  const grouped = new Map();

  for (const record of historicalRecords) {
    if (record.type !== "work" || !record.dateKey) continue;
    const weekStart = startOfWeek(parseDateKey(record.dateKey));
    const key = toDateKey(weekStart);
    const summary = grouped.get(key) || { start: weekStart, minutes: 0 };
    summary.minutes += recordStatsMinutes(record);
    grouped.set(key, summary);
  }

  const selectedKey = toDateKey(currentWeekStart);
  const selectedMinutes = records
    .filter((record) => record.type === "work")
    .reduce((sum, record) => sum + recordStatsMinutes(record), 0);
  if (selectedMinutes > 0 || grouped.has(selectedKey)) {
    grouped.set(selectedKey, {
      start: new Date(currentWeekStart),
      minutes: selectedMinutes,
    });
  }

  return [...grouped.values()].sort((a, b) => a.start - b.start);
}

function getBestWeekSummary() {
  return getHistoricalWeekSummaries()
    .filter((week) => week.minutes > 0)
    .sort((a, b) => b.minutes - a.minutes || b.start - a.start)[0] || null;
}

function getBestWorkDay(source) {
  const byDate = new Map();

  for (const record of source) {
    if (record.type !== "work") continue;
    byDate.set(
      record.dateKey,
      (byDate.get(record.dateKey) || 0) + recordStatsMinutes(record)
    );
  }

  const best = [...byDate.entries()].sort((a, b) => b[1] - a[1])[0];
  if (!best || best[1] <= 0) return null;

  const date = parseDateKey(best[0]);
  return {
    dateKey: best[0],
    label: `${weekdayName(date)} ${date.getMonth() + 1}/${date.getDate()}`,
    minutes: best[1],
  };
}

function getMainTask(source) {
  const byTitle = new Map();

  for (const record of source) {
    if (record.type !== "work") continue;
    const title = String(record.content || "工作").trim() || "工作";
    byTitle.set(title, (byTitle.get(title) || 0) + recordStatsMinutes(record));
  }

  const best = [...byTitle.entries()].sort((a, b) => b[1] - a[1])[0];
  return best && best[1] > 0 ? { title: best[0], minutes: best[1] } : null;
}

function formatChartValue(minutes) {
  if (minutes <= 0) return "0";
  if (minutes < 60) return `${Math.round(minutes)}m`;
  return `${(minutes / 60).toFixed(minutes >= 600 ? 0 : 1)}h`;
}

function getHourlyWorkMinutes(source) {
  const hourly = Array.from({ length: 24 }, () => 0);

  for (const record of source) {
    if (record.type !== "work") continue;
    const start = Number(record.start);
    if (!Number.isFinite(start)) continue;

    const rawEnd = recordStatsEndTimestamp(record, start);
    const end = Math.min(rawEnd, start + 24 * 60 * 60 * 1000);
    let cursor = start;

    while (cursor < end) {
      const cursorDate = new Date(cursor);
      const nextHour = new Date(cursorDate);
      nextHour.setMinutes(60, 0, 0);
      const segmentEnd = Math.min(end, nextHour.getTime());
      hourly[cursorDate.getHours()] += Math.max(0, (segmentEnd - cursor) / 60000);
      cursor = segmentEnd;
    }
  }

  return hourly;
}

function createSimpleLineChart(values, labels) {
  if (!values.some((value) => value > 0)) {
    return `<div class="chart-empty">这一周还没有工作记录</div>`;
  }

  const width = 760;
  const height = 210;
  const max = Math.max(...values, 1);
  const plotTop = 34;
  const plotBottom = height - 42;

  const points = values.map((value, index) => {
    const x = 52 + index * ((width - 104) / Math.max(values.length - 1, 1));
    const y = plotBottom - (value / max) * (plotBottom - plotTop);
    return { x, y, value };
  });

  return `
    <svg class="chart-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="每日工作时长折线图">
      <line class="chart-grid-line" x1="52" y1="${plotBottom}" x2="${width - 52}" y2="${plotBottom}"></line>
      <polyline class="chart-line" points="${points.map((point) => `${point.x},${point.y}`).join(" ")}"></polyline>
      ${points.map((point, index) => `
        <circle class="chart-point" cx="${point.x}" cy="${point.y}" r="4"></circle>
        <text class="chart-value" x="${point.x}" y="${Math.max(18, point.y - 10)}" text-anchor="middle">${formatChartValue(point.value)}</text>
        <text class="chart-label" x="${point.x}" y="${height - 14}" text-anchor="middle">${escapeHtml(labels[index])}</text>
      `).join("")}
    </svg>
  `;
}

function createWeeklyBarChart(weeks) {
  if (!weeks.some((week) => week.minutes > 0)) {
    return `<div class="chart-empty">最近六周还没有工作记录</div>`;
  }

  const width = 760;
  const height = 230;
  const plotTop = 30;
  const plotBottom = height - 48;
  const max = Math.max(...weeks.map((week) => week.minutes), 1);
  const slotWidth = (width - 96) / weeks.length;
  const barWidth = Math.min(62, slotWidth * 0.58);

  return `
    <svg class="chart-svg chart-bar-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="近六周工作时长柱状图">
      <line class="chart-grid-line" x1="48" y1="${plotBottom}" x2="${width - 48}" y2="${plotBottom}"></line>
      ${weeks.map((week, index) => {
        const x = 48 + index * slotWidth + (slotWidth - barWidth) / 2;
        const barHeight = week.minutes > 0
          ? Math.max(3, (week.minutes / max) * (plotBottom - plotTop))
          : 0;
        const y = plotBottom - barHeight;
        return `
          <rect class="chart-bar" x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" rx="8">
            <title>${formatWeekRange(week.start)}：${formatDuration(week.minutes)}</title>
          </rect>
          <text class="chart-value" x="${x + barWidth / 2}" y="${Math.max(18, y - 9)}" text-anchor="middle">${formatChartValue(week.minutes)}</text>
          <text class="chart-label" x="${x + barWidth / 2}" y="${height - 16}" text-anchor="middle">${escapeHtml(week.label)}</text>
        `;
      }).join("")}
    </svg>
  `;
}

function createHourlyBarChart(hourly) {
  if (!hourly.some((minutes) => minutes > 0)) {
    return `<div class="chart-empty">这一周还没有工作时段数据</div>`;
  }

  const width = 760;
  const height = 220;
  const plotTop = 28;
  const plotBottom = height - 42;
  const max = Math.max(...hourly, 1);
  const slotWidth = (width - 72) / 24;
  const barWidth = Math.max(8, slotWidth - 7);

  return `
    <svg class="chart-svg hourly-chart-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="每小时工作时长分布图">
      <line class="chart-grid-line" x1="36" y1="${plotBottom}" x2="${width - 36}" y2="${plotBottom}"></line>
      ${hourly.map((minutes, hour) => {
        const x = 36 + hour * slotWidth + (slotWidth - barWidth) / 2;
        const barHeight = minutes > 0
          ? Math.max(2, (minutes / max) * (plotBottom - plotTop))
          : 0;
        const y = plotBottom - barHeight;
        const label = hour % 3 === 0 ? String(hour).padStart(2, "0") : "";
        return `
          <rect class="chart-bar hourly-bar" x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" rx="4">
            <title>${String(hour).padStart(2, "0")}:00–${String((hour + 1) % 24).padStart(2, "0")}:00：${formatDuration(minutes)}</title>
          </rect>
          ${label ? `<text class="chart-label" x="${x + barWidth / 2}" y="${height - 14}" text-anchor="middle">${label}</text>` : ""}
        `;
      }).join("")}
    </svg>
  `;
}

function renderDashboardCharts() {
  const selectedWeekLabel = isSameWeek(currentWeekStart, new Date()) ? "本周" : "所选周";
  if (taskRankingTitle) taskRankingTitle.textContent = `${selectedWeekLabel}任务投入排行`;

  if (weeklyCompareChart) {
    weeklyCompareChart.innerHTML = createWeeklyBarChart(getSixWeekSummaries());
  }

  const tasks = new Map();
  records
    .filter((record) => record.type === "work")
    .forEach((record) => {
      const name = String(record.content || "工作").trim() || "工作";
      tasks.set(name, (tasks.get(name) || 0) + recordStatsMinutes(record));
    });

  const top = [...tasks.entries()]
    .filter(([, value]) => value > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const max = top[0]?.[1] || 1;

  if (taskRankingChart) {
    taskRankingChart.innerHTML = top.map(([name, value], index) => `
      <div class="task-item">
        <div class="task-title">
          <span><em>${index + 1}</em>${escapeHtml(name)}</span>
          <strong>${formatDuration(value)}</strong>
        </div>
        <div class="task-bar-track">
          <div class="task-bar" style="width:${(value / max) * 100}%"></div>
        </div>
      </div>
    `).join("") || `<div class="chart-empty">这一周还没有工作记录</div>`;
  }

  if (workTimeDistributionChart) {
    const hourly = getHourlyWorkMinutes(records);
    const peakMinutes = Math.max(...hourly);
    const peakHour = peakMinutes > 0 ? hourly.indexOf(peakMinutes) : -1;
    workTimeDistributionChart.innerHTML = createHourlyBarChart(hourly);
    if (workTimeDistributionMeta) {
      workTimeDistributionMeta.textContent = peakHour >= 0
        ? `高峰 ${String(peakHour).padStart(2, "0")}:00–${String((peakHour + 1) % 24).padStart(2, "0")}:00 · ${formatDuration(peakMinutes)}`
        : "暂无工作记录";
    }
  }
}

const durationBreakdownTypes = [
  ["工作", "work", (record) => record.type === "work"],
  ["休息", "break", (record) => record.type === "break"],
  ["生活", "life", (record) => record.type === "life" && !record.autoFilled],
  ["娱乐", "entertainment", (record) => record.type === "entertainment"],
  ["未记录", "unrecorded", (record) => record.autoFilled],
];

function buildDurationBreakdown(source) {
  const items = durationBreakdownTypes.map(([name, type, matches]) => {
    const minutes = sumMinutes(source.filter(matches));
    return { name, type, minutes };
  });
  const total = items.reduce((sum, item) => sum + item.minutes, 0);
  return { total, items };
}

function createDurationSegmentBar(items, total) {
  if (total <= 0) return "";

  return `
    <div class="duration-segments" aria-hidden="true">
      ${items
        .filter((item) => item.minutes > 0)
        .map((item) => `
          <span
            class="duration-segment duration-segment-${item.type}"
            style="width:${Math.max(2, (item.minutes / total) * 100)}%"
          ></span>
        `).join("")}
    </div>
  `;
}

function createDurationRows(items, total) {
  return items.map((item) => {
    const ratio = total > 0 ? Math.round((item.minutes / total) * 100) : 0;
    return `
      <div class="duration-row">
        <span><i class="duration-dot duration-dot-${item.type}"></i>${item.name}</span>
        <strong>${formatDuration(item.minutes)} · ${ratio}%</strong>
      </div>
    `;
  }).join("");
}

function renderDailyDurationVisual() {
  if (!dailyDurationVisual) return;

  const today = new Date();
  const showUntilToday = isSameWeek(currentWeekStart, today);
  const days = weekDates().filter((day) => !showUntilToday || day <= today);
  const daily = days.map((day) => {
    const dayRecords = records.filter((record) => record.dateKey === toDateKey(day));
    const breakdown = buildDurationBreakdown(dayRecords);
    const workMinutes = breakdown.items.find((item) => item.type === "work")?.minutes || 0;
    const workRatio = breakdown.total > 0 ? Math.round((workMinutes / breakdown.total) * 100) : 0;
    return { day, ...breakdown, workRatio };
  });
  const visibleDaily = daily.filter((item) => item.total > 0);
  const total = daily.reduce((sum, item) => sum + item.total, 0);
  const maxDayTotal = Math.max(...daily.map((item) => item.total), 1);
  const activeDays = visibleDaily.length;
  const workTotal = daily.reduce((sum, day) => {
    const workItem = day.items.find((item) => item.type === "work");
    return sum + (workItem?.minutes || 0);
  }, 0);

  if (dailyDurationTitle) dailyDurationTitle.textContent = "每日时长统计";
  if (dailyDurationMeta) {
    dailyDurationMeta.textContent = total > 0
      ? `${visibleDaily.length} 天有记录`
      : "暂无记录";
  }

  dailyDurationVisual.innerHTML = total > 0
    ? `
      <div class="duration-hero">
        <div>
          <span>本周记录</span>
          <strong>${formatDuration(total)}</strong>
        </div>
        <div>
          <span>日均记录</span>
          <strong>${formatDuration(activeDays ? total / activeDays : 0)}</strong>
        </div>
      </div>
      <div class="daily-duration-list">
        ${daily.map((item) => {
          const width = item.total > 0 ? Math.max(6, (item.total / maxDayTotal) * 100) : 0;
          return `
            <div class="daily-duration-item${item.total <= 0 ? " empty" : ""}">
              <div class="daily-duration-head">
                <span>${weekdayName(item.day)} ${item.day.getMonth() + 1}/${item.day.getDate()}</span>
                <strong>${item.total > 0 ? formatDuration(item.total) : "0分"}</strong>
              </div>
              <div class="daily-duration-track">
                <div class="daily-duration-fill" style="width:${width}%">
                  ${createDurationSegmentBar(item.items, item.total)}
                </div>
              </div>
              <div class="daily-duration-meta">
                <span>工作占比 ${item.workRatio}%</span>
                <span>${item.total > 0 ? createDailyDurationSummary(item.items) : "暂无记录"}</span>
              </div>
            </div>
          `;
        }).join("")}
      </div>
      <div class="duration-footnote">工作 ${formatDuration(workTotal)} · 非工作 ${formatDuration(Math.max(0, total - workTotal))}</div>
    `
    : `<div class="chart-empty compact">这一周还没有时间记录</div>`;
}

function createDailyDurationSummary(items) {
  return items
    .filter((item) => item.minutes > 0)
    .map((item) => `${item.name}${formatChartValue(item.minutes)}`)
    .join(" · ");
}

function renderActivityHeatmap() {
  if (!activityHeatmap) return;

  const heatmapDays = 365;
  const end = new Date();
  end.setHours(0, 0, 0, 0);
  const start = new Date(end);
  start.setDate(start.getDate() - heatmapDays + 1);

  const minutesByDate = new Map();
  for (const record of historicalRecords) {
    if (!record?.dateKey || record.dateKey < toDateKey(start) || record.dateKey > toDateKey(end)) continue;
    minutesByDate.set(
      record.dateKey,
      (minutesByDate.get(record.dateKey) || 0) + recordStatsMinutes(record)
    );
  }

  const days = [];
  for (const cursor = new Date(start); cursor <= end; cursor.setDate(cursor.getDate() + 1)) {
    const day = new Date(cursor);
    const key = toDateKey(day);
    days.push({ day, key, minutes: Math.round(minutesByDate.get(key) || 0) });
  }

  const paddedStart = new Date(start);
  const startWeekday = (paddedStart.getDay() + 6) % 7;
  paddedStart.setDate(paddedStart.getDate() - startWeekday);

  const paddedDays = [];
  for (const cursor = new Date(paddedStart); cursor <= end; cursor.setDate(cursor.getDate() + 1)) {
    const day = new Date(cursor);
    const key = toDateKey(day);
    const inRange = key >= toDateKey(start) && key <= toDateKey(end);
    paddedDays.push({
      day,
      key,
      inRange,
      minutes: inRange ? Math.round(minutesByDate.get(key) || 0) : 0,
    });
  }

  const weeks = [];
  for (let index = 0; index < paddedDays.length; index += 7) {
    weeks.push(paddedDays.slice(index, index + 7));
  }

  const activeDays = days.filter((item) => item.minutes > 0);
  const totalMinutes = days.reduce((sum, item) => sum + item.minutes, 0);
  const maxMinutes = Math.max(...days.map((item) => item.minutes), 1);
  const bestDay = activeDays.sort((a, b) => b.minutes - a.minutes)[0];
  const monthLabels = weeks.map((week, index) => {
    const firstInRange = week.find((item) => item.inRange && item.day.getDate() <= 7);
    if (!firstInRange && index !== 0) return "";
    const labelDay = firstInRange || week.find((item) => item.inRange);
    return labelDay ? `${labelDay.day.getMonth() + 1}月` : "";
  });

  activityHeatmap.innerHTML = `
    <div class="heatmap-summary">
      <span>最近一年 · ${activeDays.length} 天有记录</span>
      <strong>${formatDuration(totalMinutes)}</strong>
    </div>
    <div class="heatmap-shell">
      <div class="heatmap-weekdays">
        <span>一</span><span></span><span>三</span><span></span><span>五</span><span></span><span>日</span>
      </div>
      <div>
        <div class="heatmap-months" style="grid-template-columns: repeat(${weeks.length}, var(--heatmap-cell));">
          ${monthLabels.map((label) => `<span>${escapeHtml(label)}</span>`).join("")}
        </div>
        <div class="heatmap-grid" style="grid-template-columns: repeat(${weeks.length}, var(--heatmap-cell));">
          ${weeks.map((week) => `
            <div class="heatmap-week">
              ${week.map((item) => {
                const level = item.inRange ? heatmapLevel(item.minutes, maxMinutes) : 0;
                const title = item.inRange
                  ? `${item.day.getMonth() + 1}/${item.day.getDate()}：${formatDuration(item.minutes)}`
                  : "";
                return `<span class="heatmap-cell level-${level}${item.inRange ? "" : " outside"}" title="${escapeHtml(title)}"></span>`;
              }).join("")}
            </div>
          `).join("")}
        </div>
      </div>
    </div>
    <div class="heatmap-footer">
      <span>${bestDay ? `最高 ${bestDay.day.getMonth() + 1}/${bestDay.day.getDate()} · ${formatDuration(bestDay.minutes)}` : "暂无记录"}</span>
      <span class="heatmap-legend">少 <i class="level-1"></i><i class="level-2"></i><i class="level-3"></i><i class="level-4"></i> 多</span>
    </div>
  `;
}

function heatmapLevel(minutes, maxMinutes) {
  if (minutes <= 0) return 0;
  const ratio = minutes / Math.max(1, maxMinutes);
  if (ratio >= 0.75) return 4;
  if (ratio >= 0.45) return 3;
  if (ratio >= 0.20) return 2;
  return 1;
}

function renderAdvancedDashboard() {
  renderDailyDurationVisual();
  renderActivityHeatmap();

  if (bestWeekContent) {
    const current = records
      .filter((record) => record.type === "work")
      .reduce((sum, record) => sum + recordStatsMinutes(record), 0);
    const bestWeek = getBestWeekSummary();

    if (!bestWeek) {
      bestWeekContent.innerHTML = `<div class="chart-empty compact">暂无历史工作记录</div>`;
    } else {
      const completion = bestWeek.minutes > 0
        ? Math.round((current / bestWeek.minutes) * 100)
        : 0;
      const difference = current - bestWeek.minutes;
      const differenceText = Math.abs(difference) < 1
        ? "当前周即历史最佳"
        : difference > 0
          ? `高出原最佳 ${formatDuration(difference)}`
          : `距离最佳还差 ${formatDuration(Math.abs(difference))}`;

      bestWeekContent.innerHTML = `
        <div class="best-week-grid">
          <div>
            <span>当前所选周</span>
            <strong>${formatDuration(current)}</strong>
          </div>
          <div>
            <span>历史最佳</span>
            <strong>${formatDuration(bestWeek.minutes)}</strong>
          </div>
        </div>
        <div class="best-week-meta">
          <span>${escapeHtml(formatWeekRange(bestWeek.start))}</span>
          <strong>${completion}%</strong>
        </div>
        <div class="progress-line">
          <div class="progress-fill" style="width:${Math.min(100, completion)}%"></div>
        </div>
        <p>${differenceText}</p>
      `;
    }
  }

  if (timeCompositionChart) {
    const types = [
      ["工作", "work", (record) => record.type === "work"],
      ["休息", "break", (record) => record.type === "break"],
      ["生活", "life", (record) => record.type === "life" && !record.autoFilled],
      ["娱乐", "entertainment", (record) => record.type === "entertainment"],
      ["未记录", "unrecorded", (record) => record.autoFilled],
    ];
    const total = records.reduce((sum, record) => sum + recordStatsMinutes(record), 0);
    const coverage = getRecordCoverage(records);

    timeCompositionChart.innerHTML = total > 0
      ? `
        <div class="coverage-summary">
          <span>记录覆盖率</span>
          <strong>${coverage.available ? `${coverage.ratio}%` : "待更多记录"}</strong>
        </div>
        ${types.map(([name, type, matches]) => {
          const value = records
            .filter(matches)
            .reduce((sum, record) => sum + recordStatsMinutes(record), 0);
          const ratio = (value / total) * 100;

          return `
            <div class="composition-row">
              <div class="progress-label">
                <span>${name}</span>
                <span>${formatDuration(value)} · ${Math.round(ratio)}%</span>
              </div>
              <div class="progress-line">
                <div class="progress-fill progress-fill-${type}" style="width:${ratio}%"></div>
              </div>
            </div>
          `;
        }).join("")}
      `
      : `<div class="chart-empty compact">这一周还没有时间记录</div>`;
  }

  if (calendarProgress) {
    const now = new Date();
    const monthDays = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const monthPassed = now.getDate();
    const yearStart = new Date(now.getFullYear(), 0, 1);
    const nextYearStart = new Date(now.getFullYear() + 1, 0, 1);
    const yearDays = Math.round((nextYearStart - yearStart) / 86400000);
    const yearPassed = Math.floor((now - yearStart) / 86400000) + 1;
    const monthRatio = (monthPassed / monthDays) * 100;
    const yearRatio = (yearPassed / yearDays) * 100;

    calendarProgress.innerHTML = `
      <div class="calendar-progress-item">
        <div class="calendar-progress-copy">
          <span>本月进度</span>
          <strong>${Math.round(monthRatio)}%</strong>
          <small>剩余 ${Math.max(0, monthDays - monthPassed)} 天</small>
        </div>
        <div class="progress-line">
          <div class="progress-fill" style="width:${monthRatio}%"></div>
        </div>
      </div>
      <div class="calendar-progress-item">
        <div class="calendar-progress-copy">
          <span>本年进度</span>
          <strong>${Math.round(yearRatio)}%</strong>
          <small>剩余 ${Math.max(0, yearDays - yearPassed)} 天</small>
        </div>
        <div class="progress-line">
          <div class="progress-fill" style="width:${yearRatio}%"></div>
        </div>
      </div>
    `;
  }
}

function renderSummaryDetails() {
  const weekStats = buildPeriodStats(records);
  const summaryTitle = isSameWeek(currentWeekStart, new Date()) ? "本周概览" : "所选周概览";

  weekSummaryMeta.textContent = `${weekStats.work.count} 个工作段 · ${formatDuration(weekStats.work.totalMinutes)}`;
  weekSummary.innerHTML = renderPeriodSummaryCard(summaryTitle, weekStats, { showDate: false });

  const today = new Date();
  today.setHours(23, 59, 59, 999);

  const days = weekDates()
    .filter((day) => !isSameWeek(currentWeekStart, new Date()) || day <= today)
    .reverse();

  daySummary.innerHTML = days.map((day) => {
    const dateKey = toDateKey(day);
    const dayRecords = records.filter((record) => record.dateKey === dateKey);
    const stats = buildPeriodStats(dayRecords);
    const title = `${weekdayName(day)} · ${String(day.getMonth() + 1).padStart(2, "0")}/${String(day.getDate()).padStart(2, "0")}`;
    return renderPeriodSummaryCard(title, stats, { compact: true });
  }).join("");
}

function sumMinutes(items) {
  return Math.round(items.reduce((sum, record) => sum + recordStatsMinutes(record), 0));
}

function buildPeriodStats(periodRecords) {
  const workRecords = periodRecords.filter((record) => record.type === "work");
  const breakRecords = periodRecords.filter((record) => record.type === "break");
  const lifeRecords = periodRecords.filter(
    (record) => record.type === "life" && !record.autoFilled
  );
  const unrecordedRecords = periodRecords.filter((record) => record.autoFilled);
  const entertainmentRecords = periodRecords.filter((record) => record.type === "entertainment");
  const coverage = getRecordCoverage(periodRecords);

  return {
    work: buildWorkStats(workRecords),
    breaks: {
      count: breakRecords.length,
      totalMinutes: sumMinutes(breakRecords),
    },
    life: {
      count: lifeRecords.length,
      totalMinutes: sumMinutes(lifeRecords),
      byReason: buildGroupedMinutes(lifeRecords, (record) => record.content || "生活"),
    },
    unrecorded: {
      count: unrecordedRecords.length,
      totalMinutes: sumMinutes(unrecordedRecords),
    },
    entertainment: {
      count: entertainmentRecords.length,
      totalMinutes: sumMinutes(entertainmentRecords),
      byReason: buildGroupedMinutes(entertainmentRecords, (record) => record.content || "娱乐"),
    },
    quality: buildQualityStats(workRecords),
    longestWorkMinutes: longestContinuousWorkMinutes(workRecords),
    coverage,
  };
}

function buildWorkStats(workRecords) {
  const totalMinutes = sumMinutes(workRecords);
  const byTitle = new Map();

  for (const record of workRecords) {
    const title = record.content || "工作";
    const item = byTitle.get(title) || { title, minutes: 0, count: 0 };
    item.minutes += Math.round(recordStatsMinutes(record));
    item.count += 1;
    byTitle.set(title, item);
  }

  return {
    count: workRecords.length,
    completed: workRecords.filter((record) => record.completedNaturally === true).length,
    unclassified: workRecords.filter(
      (record) => record.end != null && typeof record.completedNaturally !== "boolean"
    ).length,
    totalMinutes,
    byTitle: [...byTitle.values()].sort((a, b) => b.minutes - a.minutes || b.count - a.count),
  };
}

function buildGroupedMinutes(items, labelFn) {
  const grouped = new Map();
  for (const item of items) {
    const label = String(labelFn(item) || "未填写").trim() || "未填写";
    const current = grouped.get(label) || { label, count: 0, minutes: 0 };
    current.count += 1;
    current.minutes += Math.round(recordStatsMinutes(item));
    grouped.set(label, current);
  }
  return [...grouped.values()].sort((a, b) => b.minutes - a.minutes || b.count - a.count);
}

function buildQualityStats(workRecords) {
  const stats = {
    reviewed: 0,
    pending: 0,
    skipped: 0,
    completion: { low: 0, medium: 0, high: 0 },
    focus: { poor: 0, normal: 0, good: 0 },
    interruption: { none: 0, light: 0, severe: 0 },
  };

  for (const record of workRecords) {
    if (record.reviewPending === true && record.end) {
      stats.pending += 1;
      continue;
    }

    if (record.reviewSkipped) {
      stats.skipped += 1;
      continue;
    }

    const hasReviewData = Boolean(
      record.completion ||
      record.focus ||
      record.interruption ||
      record.reviewNote
    );

    if (!hasReviewData) {
      continue;
    }

    stats.reviewed += 1;
    if (record.completion && stats.completion[record.completion] != null) {
      stats.completion[record.completion] += 1;
    }
    if (record.focus && stats.focus[record.focus] != null) {
      stats.focus[record.focus] += 1;
    }
    if (record.interruption && stats.interruption[record.interruption] != null) {
      stats.interruption[record.interruption] += 1;
    }
  }

  return stats;
}

function longestContinuousWorkMinutes(workRecords) {
  if (!workRecords.length) return 0;

  let longest = 0;
  let current = 0;
  let previous = null;

  for (const record of [...workRecords].sort((a, b) => a.start - b.start)) {
    const minutes = Math.round(recordStatsMinutes(record));
    if (
      previous &&
      (record.content || "工作") === (previous.content || "工作") &&
      Math.abs((record.start || 0) - (previous.end || previous.start || 0)) <= 3 * 60 * 1000
    ) {
      current += minutes;
    } else {
      current = minutes;
    }
    longest = Math.max(longest, current);
    previous = record;
  }

  return longest;
}

function renderPeriodSummaryCard(title, stats) {
  const taskLines = stats.work.byTitle.length
    ? stats.work.byTitle.slice(0, 6).map((item) => `
        <div class="summary-line task-line">
          <span>${escapeHtml(item.title)} <em>${item.count}段</em></span>
          <strong>${formatDuration(item.minutes)}</strong>
        </div>
      `).join("")
    : `<div class="summary-line"><span>暂无工作记录</span><strong>0分</strong></div>`;

  const lifeLines = stats.life.byReason.length
    ? stats.life.byReason.slice(0, 4).map((item) => `<div class="summary-line"><span>${escapeHtml(item.label)} <em>${item.count}次</em></span><strong>${formatDuration(item.minutes)}</strong></div>`).join("")
    : `<div class="summary-line"><span>暂无生活记录</span><strong>0分</strong></div>`;

  const entertainmentLines = stats.entertainment.byReason.length
    ? stats.entertainment.byReason.slice(0, 4).map((item) => `<div class="summary-line"><span>${escapeHtml(item.label)} <em>${item.count}次</em></span><strong>${formatDuration(item.minutes)}</strong></div>`).join("")
    : `<div class="summary-line"><span>暂无娱乐记录</span><strong>0次</strong></div>`;

  return `
    <div class="summary-card enhanced-summary">
      <h3>${escapeHtml(title)}</h3>

      <div class="summary-section">
        <h4>概览</h4>
        <div class="summary-line"><span>工作段 / 完整番茄</span><strong>${stats.work.count} / ${stats.work.completed}</strong></div>
        ${stats.work.unclassified ? `<div class="summary-line"><span>历史未分类工作段</span><strong>${stats.work.unclassified}</strong></div>` : ""}
        <div class="summary-line"><span>工作总时长</span><strong>${formatDuration(stats.work.totalMinutes)}</strong></div>
        <div class="summary-line"><span>休息总时长</span><strong>${formatDuration(stats.breaks.totalMinutes)}</strong></div>
        <div class="summary-line"><span>生活时间</span><strong>${formatDuration(stats.life.totalMinutes)}</strong></div>
        <div class="summary-line"><span>娱乐时间</span><strong>${formatDuration(stats.entertainment.totalMinutes)}</strong></div>
        <div class="summary-line"><span>未记录时间</span><strong>${formatDuration(stats.unrecorded.totalMinutes)}</strong></div>
        <div class="summary-line"><span>记录覆盖率</span><strong>${stats.coverage.available ? `${stats.coverage.ratio}%` : "待更多记录"}</strong></div>
        <div class="summary-line"><span>最长连续同标题工作</span><strong>${formatDuration(stats.longestWorkMinutes)}</strong></div>
      </div>

      <div class="summary-section">
        <h4>主要任务</h4>
        ${taskLines}
      </div>

      <div class="summary-section">
        <h4>质量统计</h4>
        <div class="summary-line"><span>已评价 / 待评价 / 已跳过</span><strong>${stats.quality.reviewed} / ${stats.quality.pending} / ${stats.quality.skipped}</strong></div>
        <div class="summary-line"><span>完成度 高 / 中 / 低</span><strong>${stats.quality.completion.high} / ${stats.quality.completion.medium} / ${stats.quality.completion.low}</strong></div>
        <div class="summary-line"><span>专注度 好 / 一般 / 差</span><strong>${stats.quality.focus.good} / ${stats.quality.focus.normal} / ${stats.quality.focus.poor}</strong></div>
        <div class="summary-line"><span>打断 无 / 轻微 / 严重</span><strong>${stats.quality.interruption.none} / ${stats.quality.interruption.light} / ${stats.quality.interruption.severe}</strong></div>
      </div>

      <div class="summary-section">
        <h4>生活记录</h4>
        ${lifeLines}
      </div>

      <div class="summary-section">
        <h4>娱乐记录</h4>
        ${entertainmentLines}
      </div>
    </div>
  `;
}

function reviewTooltipHtml(record) {
  if (record.reviewPending === true && record.end) {
    return `<div class="tooltip-note">评价：待评价</div>`;
  }

  if (record.reviewSkipped) {
    return `<div class="tooltip-note">评价：已跳过</div>`;
  }

  const parts = [];
  if (record.completion) parts.push(`完成度 ${reviewLabel("completion", record.completion)}`);
  if (record.focus) parts.push(`专注度 ${reviewLabel("focus", record.focus)}`);
  if (record.interruption) parts.push(`打断 ${reviewLabel("interruption", record.interruption)}`);

  if (!parts.length && !record.reviewNote) return "";

  return `
    <div class="tooltip-note">
      评价：${escapeHtml(parts.join(" · ") || "已评价")}
      ${record.reviewNote ? `<br>完成情况：${escapeHtml(record.reviewNote)}` : ""}
    </div>
  `;
}

function reviewLabel(group, value) {
  const labels = {
    completion: { low: "低", medium: "中", high: "高" },
    focus: { poor: "差", normal: "一般", good: "好" },
    interruption: { none: "无", light: "轻微", severe: "严重" },
  };
  return labels[group]?.[value] || value || "";
}

function formatCompactDurationFromMs(milliseconds) {
  const totalMinutes = Math.max(0, Math.round(Number(milliseconds || 0) / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0 && minutes > 0) return `${hours}h${minutes}m`;
  if (hours > 0) return `${hours}h`;
  return `${minutes}m`;
}

function formatDuration(totalMinutes) {
  const minutes = Math.max(0, Math.round(Number(totalMinutes) || 0));
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;

  if (hours > 0 && rest > 0) {
    return `${hours}小时${rest}分`;
  }

  if (hours > 0) {
    return `${hours}小时`;
  }

  return `${rest}分`;
}

function showTimelineTooltip(event, record) {
  if (!timelineTooltip) return;

  const start = record.start;
  const end = record.end || Date.now();
  const minutes = Math.round(durationMs(record) / 60000);
  const date = record.dateKey || dateKeyFromTimestamp(start);
  const mergedCount = record.mergedCount || 1;
  const interruptionHtml = Array.isArray(record.interruptions) && record.interruptions.length
    ? `<div class="tooltip-note">打断：${record.interruptions.map((item) => {
        const duration = formatCompactDurationFromMs(item.durationMs || 0);
        return `${escapeHtml(duration)} · ${escapeHtml(item.reason || "短暂离开")}`;
      }).join("<br>")}</div>`
    : "";

  const mergedTimelineHtml = mergedCount > 1
    ? `
      <div class="tooltip-note">
        连续番茄：${mergedCount} 个
        ${record.mergedReviews?.length ? `<br>${record.mergedReviews.map((item, index) => {
          const review = item.reviewText ? ` · 评价：${escapeHtml(item.reviewText)}` : "";
          return `${index + 1}. ${escapeHtml(formatTime(item.start))}-${escapeHtml(formatTime(item.end))}${review}`;
        }).join("<br>")}` : ""}
      </div>
    `
    : "";

  timelineTooltip.innerHTML = `
    <div class="tooltip-kicker">
      <span>${escapeHtml(typeName(record.type))}</span>
      <span>${escapeHtml(date)}</span>
    </div>
    <div class="tooltip-title">${escapeHtml(getRecordLabel(record))}</div>
    <div class="tooltip-grid">
      <span class="tooltip-label">时间</span><span>${escapeHtml(formatTime(start))} - ${escapeHtml(formatTime(end))}</span>
      <span class="tooltip-label">时长</span><span>${escapeHtml(formatDuration(minutes))}</span>
      ${mergedCount > 1 ? `<span class="tooltip-label">连续番茄</span><span>${escapeHtml(String(mergedCount))} 个</span>` : ""}
      ${record.round ? `<span class="tooltip-label">轮次</span><span>第 ${escapeHtml(record.round)} 轮</span>` : ""}
    </div>
    ${interruptionHtml}
    ${mergedTimelineHtml}
    ${record.type === "work" && mergedCount === 1 ? reviewTooltipHtml(record) : ""}
  `;

  timelineTooltip.classList.remove("hidden");
  moveTimelineTooltip(event);
}

function moveTimelineTooltip(event) {
  if (!timelineTooltip || timelineTooltip.classList.contains("hidden")) return;

  const margin = 16;
  const rect = timelineTooltip.getBoundingClientRect();
  let x = event.clientX + 14;
  let y = event.clientY + 14;

  if (x + rect.width + margin > window.innerWidth) {
    x = event.clientX - rect.width - 14;
  }

  if (y + rect.height + margin > window.innerHeight) {
    y = event.clientY - rect.height - 14;
  }

  timelineTooltip.style.left = `${Math.max(margin, x)}px`;
  timelineTooltip.style.top = `${Math.max(margin, y)}px`;
}

function hideTimelineTooltip() {
  if (!timelineTooltip) return;
  timelineTooltip.classList.add("hidden");
}


function computeDisplayRange(defaultStartMinutes, defaultEndMinutes, sourceRecords = records) {
  const visibleRecords = sourceRecords.filter((record) => Number.isFinite(Number(record.start)));
  const isCurrentWeek = isSameWeek(currentWeekStart, new Date());
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  if (visibleRecords.length === 0) {
    if (!isCurrentWeek) {
      return { start: defaultStartMinutes, end: defaultEndMinutes };
    }

    return {
      start: Math.max(0, Math.min(defaultStartMinutes, Math.floor((nowMinutes - 30) / 30) * 30)),
      end: Math.min(
        24 * 60,
        Math.max(defaultEndMinutes, Math.ceil((nowMinutes + 30) / 30) * 30)
      ),
    };
  }

  let minStart = 24 * 60;
  let maxEnd = 0;

  for (const record of visibleRecords) {
    const s = minutesOfDay(record.start);
    const e = minutesOfDay(record.end || Date.now());
    minStart = Math.min(minStart, s);
    maxEnd = Math.max(maxEnd, e);
  }

  if (isCurrentWeek) {
    minStart = Math.min(minStart, nowMinutes);
    maxEnd = Math.max(maxEnd, nowMinutes);
  }

  // Dynamic range: one hour before the earliest record and one hour after the latest record.
  // Snap to half-hour boundaries so the grid remains readable.
  let start = Math.floor((minStart - 60) / 30) * 30;
  let end = Math.ceil((maxEnd + 60) / 30) * 30;

  start = Math.max(0, start);
  end = Math.min(24 * 60, Math.max(end, start + 60));

  return { start, end };
}

function computeRowHeight(range) {
  const spanMinutes = Math.max(60, range.end - range.start);

  if (spanMinutes <= 3 * 60) return 88;
  if (spanMinutes <= 5 * 60) return 72;
  if (spanMinutes <= 8 * 60) return 58;
  if (spanMinutes <= 12 * 60) return 48;
  return 40;
}

function recordDisplayMode(height, durationMinutes, rowHeight) {
  if (height < 10) return "tiny";
  if (height < 22) return "compact";

  // When the grid is zoomed in, allow short records to show more text.
  if (durationMinutes < 5 && rowHeight < 58) return "compact";
  if (durationMinutes < 3) return "compact";

  return "full";
}

function assignLanes(sourceRecords, range) {
  const normalized = sourceRecords.map((record) => {
    const startMinutes = Math.max(range.start, minutesOfDay(record.start));
    const endMinutes = Math.min(range.end, Math.max(minutesOfDay(record.end || Date.now()), startMinutes + 1));
    return { record, startMinutes, endMinutes, lane: 0, laneCount: 1 };
  });

  const groups = [];
  const sorted = [...normalized].sort((a, b) => a.startMinutes - b.startMinutes || a.endMinutes - b.endMinutes);

  for (const item of sorted) {
    let placed = false;

    for (const group of groups) {
      if (item.startMinutes < group.endMinutes) {
        group.items.push(item);
        group.endMinutes = Math.max(group.endMinutes, item.endMinutes);
        placed = true;
        break;
      }
    }

    if (!placed) groups.push({ endMinutes: item.endMinutes, items: [item] });
  }

  for (const group of groups) {
    const lanes = [];

    for (const item of group.items) {
      let laneIndex = lanes.findIndex((laneEnd) => laneEnd <= item.startMinutes);
      if (laneIndex === -1) {
        laneIndex = lanes.length;
        lanes.push(item.endMinutes);
      } else {
        lanes[laneIndex] = item.endMinutes;
      }
      item.lane = laneIndex;
    }

    const laneCount = Math.max(1, lanes.length);
    for (const item of group.items) item.laneCount = laneCount;
  }

  return normalized;
}

function weekDates() {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(currentWeekStart);
    date.setDate(currentWeekStart.getDate() + index);
    return date;
  });
}

function weekDateKeys() {
  return weekDates().map(toDateKey);
}

function startOfWeek(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

function startOfDay(date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function isSameWeek(a, b) {
  return toDateKey(startOfWeek(a)) === toDateKey(startOfWeek(b));
}

function todayKey() {
  return toDateKey(new Date());
}

function timelineStorageKey(dateKey = todayKey()) {
  return `minimalPomodoroTimeline:${dateKey}`;
}

function inspirationStorageKey(dateKey = todayKey()) {
  return `minimalPomodoroInspirations:${dateKey}`;
}

function normalizeInspirationText(value) {
  return String(value || "").replace(/\r\n/g, "\n").trim();
}

function toDateKey(date) {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function dateKeyFromTimestamp(ts) {
  return toDateKey(new Date(ts));
}

function parseDateKey(dateKey) {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function weekdayName(date) {
  return ["周日", "周一", "周二", "周三", "周四", "周五", "周六"][date.getDay()];
}

function formatDate(date) {
  return date.toLocaleDateString("zh-CN", {
    month: "long",
    day: "numeric",
    weekday: "short",
  });
}

function formatMonthDay(date) {
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function formatWeekRange(weekStart) {
  const start = new Date(weekStart);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  return `${start.getFullYear()}/${start.getMonth() + 1}/${start.getDate()} – ${end.getFullYear()}/${end.getMonth() + 1}/${end.getDate()}`;
}

function formatTime(ts) {
  const date = new Date(ts);
  return `${date.getHours()}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function timestampToTime(ts) {
  const date = new Date(ts);
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function timeToTimestamp(value, dateKey) {
  if (!value || !/^\d{2}:\d{2}$/.test(value) || !dateKey) return null;
  const [h, m] = value.split(":").map(Number);
  const date = parseDateKey(dateKey);
  date.setHours(h, m, 0, 0);
  return date.getTime();
}

function minutesOfDay(ts) {
  const date = new Date(ts);
  return date.getHours() * 60 + date.getMinutes();
}

function durationMs(record) {
  return Math.max(0, (record.end || Date.now()) - record.start);
}

function createId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function compactRecordLabel(record) {
  if (record.type === "work") return "🍅";
  if (record.type === "break") return "休";
  if (record.type === "life") return "生";
  if (record.type === "entertainment") return "娱";
  return getRecordLabel(record);
}

function defaultContent(type) {
  if (type === "work") return "工作";
  if (type === "break") return "休息";
  if (type === "life") return "生活";
  if (type === "entertainment") return "娱乐";
  return typeName(type);
}

function getReviewText(record) {
  if (record.reviewPending === true && record.end) return "待评价";
  if (record.reviewSkipped) return "已跳过";

  const parts = [];
  if (record.completion) parts.push(`完成度${reviewLabel("completion", record.completion)}`);
  if (record.focus) parts.push(`专注度${reviewLabel("focus", record.focus)}`);
  if (record.interruption) parts.push(`打断${reviewLabel("interruption", record.interruption)}`);
  if (record.reviewNote) parts.push(`完成情况：${record.reviewNote}`);
  return parts.join("，");
}

function typeName(type) {
  if (type === "work") return "工作";
  if (type === "break") return "休息";
  if (type === "life") return "生活";
  if (type === "entertainment") return "娱乐";
  return customTimelineTypes.get(type) || type || "记录";
}

function getRecordLabel(record) {
  if (record.type === "work") return record.content || "工作";
  if (record.type === "break") return "休息";
  if (record.type === "life") return record.content || "生活";
  if (record.type === "entertainment") return record.content || "娱乐";
  return record.content || record.type;
}

function getTextLabel(record, tomato) {
  if (record.type === "work") return `🍅${tomato}：${record.content || "工作"}`;
  if (record.type === "break") return "休息";
  if (record.type === "life") return `🏠生活：${record.content || "生活"}`;
  if (record.type === "entertainment") return `🎮娱乐：${record.content || "娱乐"}`;
  return record.content || record.type;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
