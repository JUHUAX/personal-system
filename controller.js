const DEFAULT_SETTINGS = {
  mode: "cycle",
  singleWorkMinutes: 25,
  singleBreakMinutes: 5,
  cycleWorkMinutes: 25,
  cycleBreakMinutes: 5,
  volume: 75,
  blacklist: "youtube.com\nbilibili.com\ndouyin.com\ntiktok.com\nreddit.com\ntwitter.com\nx.com",
  whitelist: "",
  presenceMode: "normal",
};

const SMALL_SEEK = 10;
const LARGE_SEEK = 60;
const CONTROLS_HIDE_MS = 1800;
const mainPageMode = new URLSearchParams(location.search).get("main") === "1";
const mainControllerDocument = document;

let settings = { ...DEFAULT_SETTINGS };
let timer = createTimerFromSettings();
let running = false;
let tickId = null;
let pipWindow = null;
let pip = null;
let controlsHideId = null;
let settingsVisible = false;
let volumePanelVisible = false;
let activeTimelineRecordId = null;
let activeTodoContext = null;
let activeTodoStartedNotified = false;
let phaseTransitionPromise = null;
let pendingTodoAutoStart = false;

let currentWorkPlan = "工作";
let intentionalPipClose = false;
let pendingPromptResolve = null;
let promptNoteVisible = false;
let mergeNextWorkWithPrevious = false;
let adaptiveResizeObserver = null;
let adaptiveRafId = null;
let audioContext = null;
let pendingReviewCount = 0;
let activeReviewRecordId = null;
let reviewSaveInFlight = false;
let presencePromptOpen = false;
let presenceConfirmTimeoutId = null;
let leaveState = null;
let leaveThresholdTimeoutId = null;
const SHORT_LEAVE_THRESHOLD_MS = 10 * 60 * 1000;
let idleDetectedAt = null;
let inferredInactiveAt = null;
const PRESENCE_CONFIRM_TIMEOUT_MS = 2 * 60 * 1000;
const PRESENCE_IDLE_MINUTES = {
  strict: 8,
  normal: 15,
  reading: 30,
};
const CONTROLLER_HEARTBEAT_KEY = "minimalPomodoroControllerHeartbeat";

initializeController();
window.setInterval(() => persistControllerHeartbeat().catch(() => {}), 10000);

async function initializeController() {
  await loadPersistentSettings();
  await loadSelectedNotionTodo();
  updateWebsiteBlocking();
}

async function persistControllerHeartbeat() {
  await chrome.storage.local.set({
    [CONTROLLER_HEARTBEAT_KEY]: {
      at: Date.now(),
      running,
      activeTimelineRecordId: activeTimelineRecordId || "",
    },
  });
}

const launchButton = document.getElementById("launchButton");
const timelinePageButton = document.getElementById("timelinePageButton");
const fallback = document.getElementById("fallback");
const pipStatus = document.getElementById("pipStatus");

launchButton?.addEventListener("click", openPip);
timelinePageButton?.addEventListener("click", openTimelinePage);

if (mainPageMode) {
  pipWindow = window;
  buildPipDocument(document, { mainPage: true });
  render();
}

globalThis.MinimalPomodoroController = Object.freeze({
  openPip,
  async startTodoInPip(todo) {
    // requestWindow is invoked immediately from the parent's click handler so
    // Chrome keeps the required user activation for Document PiP.
    await openPip();
    if (!pip || pipWindow === window) throw new Error("置顶小窗未能打开。");
    return selectNotionTodo(todo, { autoStart: true });
  },
});

if (!mainPageMode && !supportsDocumentPiP()) {
  fallback.classList.add("visible");
}

if (chrome?.idle) {
  configurePresenceDetection();
  chrome.idle.onStateChanged.addListener(handleIdleStateChange);
}

window.addEventListener("beforeunload", () => {
  stopAll();
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message?.type) return;

  if (message.type === "STOP_POMODORO_FOR_ACCESS") {
    stopPomodoroForAccess(message.site, message.reason)
      .then(() => sendResponse({ ok: true }))
      .catch((error) => sendResponse({ ok: false, error: String(error) }));
    return true;
  }

  if (message.type === "OPEN_PENDING_REVIEW") {
    openPip().then(() => {
      setTimeout(() => openReviewPanel(), 120);
    });
  }

  if (message.type === "SELECT_NOTION_TODO") {
    selectNotionTodo(message.payload, { autoStart: true })
      .then((started) => sendResponse({ ok: true, started }))
      .catch((error) => sendResponse({ ok: false, started: false, error: error?.message || String(error) }));
    return true;
  }
});

async function loadSelectedNotionTodo() {
  try {
    const result = await chrome.storage.local.get("minimalPomodoroSelectedTodo");
    const todo = result.minimalPomodoroSelectedTodo;
    if (!todo?.id || !todo?.title) return;
    const recentRequest = Date.now() - Number(todo.requestedAt || 0) < 10 * 60 * 1000;
    await selectNotionTodo(todo, { autoStart: recentRequest });
    if (recentRequest) {
      await chrome.storage.local.set({
        minimalPomodoroSelectedTodo: { ...todo, requestedAt: 0 },
      });
    }
  } catch {}
}

async function selectNotionTodo(todo, { autoStart = false } = {}) {
  if (!todo?.id || !String(todo.title || "").trim()) throw new Error("待办信息不完整。");
  if (hasActiveTimerState() && (running || activeTimelineRecordId)) {
    throw new Error("当前已有番茄钟在进行，请先结束当前任务。");
  }
  activeTodoContext = {
    ...todo,
    id: String(todo.id),
    url: String(todo.url || ""),
    date: String(todo.date || todayKey()),
    title: String(todo.title).trim(),
    plannedStart: String(todo.plannedStart || ""),
    plannedEnd: String(todo.plannedEnd || ""),
  };
  activeTodoStartedNotified = false;
  currentWorkPlan = activeTodoContext.title;
  if (settings.mode === "break") settings.mode = "work";
  if (timer.phase !== "work" || timer.finished || timer.remaining <= 0) {
    timer = createTimerFromSettings();
  }
  if (pip?.workTitleDisplay) pip.workTitleDisplay.textContent = currentWorkPlan;
  pendingTodoAutoStart = Boolean(autoStart && !pip);
  render();
  if (autoStart && pip && !running && isTimerFreshAndIdle()) {
    await start();
    setControlStatus(`已开始待办：${currentWorkPlan}`);
    return true;
  }
  setControlStatus(`已载入待办：${currentWorkPlan}。打开置顶小窗后即可开始。`);
  return false;
}

async function clearSelectedNotionTodo() {
  activeTodoContext = null;
  activeTodoStartedNotified = false;
  currentWorkPlan = "";
  pendingTodoAutoStart = false;
  try {
    await chrome.storage.local.set({ minimalPomodoroSelectedTodo: null });
  } catch {}
}

async function loadPersistentSettings() {
  try {
    const result = await chrome.storage.local.get("minimalPomodoroSiteSettings");
    if (result.minimalPomodoroSiteSettings) {
      settings = { ...settings, ...result.minimalPomodoroSiteSettings };
      if (!["work", "break", "cycle"].includes(settings.mode)) settings.mode = DEFAULT_SETTINGS.mode;
      settings.singleWorkMinutes = readInt(settings.singleWorkMinutes, DEFAULT_SETTINGS.singleWorkMinutes, 1, 240);
      settings.singleBreakMinutes = readInt(settings.singleBreakMinutes, DEFAULT_SETTINGS.singleBreakMinutes, 1, 240);
      settings.cycleWorkMinutes = readInt(settings.cycleWorkMinutes, DEFAULT_SETTINGS.cycleWorkMinutes, 1, 240);
      settings.cycleBreakMinutes = readInt(settings.cycleBreakMinutes, DEFAULT_SETTINGS.cycleBreakMinutes, 1, 240);
      timer = createTimerFromSettings();
      syncSettingsForm();
      render();
    }
  } catch {}
}

async function savePersistentSettings() {
  try {
    await chrome.storage.local.set({
      minimalPomodoroSiteSettings: {
        mode: settings.mode,
        singleWorkMinutes: settings.singleWorkMinutes,
        singleBreakMinutes: settings.singleBreakMinutes,
        cycleWorkMinutes: settings.cycleWorkMinutes,
        cycleBreakMinutes: settings.cycleBreakMinutes,
        blacklist: settings.blacklist,
        whitelist: settings.whitelist,
        volume: settings.volume,
        presenceMode: settings.presenceMode,
      },
    });
  } catch {}
}

function parseSiteList(text) {
  return String(text || "")
    .split(/\r?\n|,/)
    .map((line) => line.trim())
    .filter(Boolean);
}

async function updateWebsiteBlocking() {
  const enabled = Boolean(running && timer.phase === "work" && !timer.finished);
  try {
    await chrome.runtime.sendMessage({
      type: "UPDATE_BLOCKING_RULES",
      payload: {
        enabled,
        blacklist: parseSiteList(settings.blacklist),
        whitelist: parseSiteList(settings.whitelist),
      },
    });
  } catch {}
}

function setControlStatus(message) {
  if (!pipStatus) return;
  pipStatus.textContent = message || "";
  pipStatus.classList.toggle("visible", Boolean(message));
}

function hasActiveTimerState() {
  return Boolean(
    running ||
    leaveState ||
    activeTimelineRecordId ||
    (!timer.finished && timer.remaining !== timer.total)
  );
}



function todayKey() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function timelineStorageKey() {
  return `minimalPomodoroTimeline:${todayKey()}`;
}

function dateKeyFromDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function timelineStorageKeyForDate(dateKey) {
  return `minimalPomodoroTimeline:${dateKey}`;
}

function recentDateKeys(days) {
  const keys = [];
  const base = new Date();
  for (let i = 0; i < days; i += 1) {
    const date = new Date(base);
    date.setDate(base.getDate() - i);
    keys.push(dateKeyFromDate(date));
  }
  return keys;
}

async function getRecordsByDateKeys(dateKeys) {
  try {
    const storageKeys = dateKeys.map((key) => timelineStorageKeyForDate(key));
    const result = await chrome.storage.local.get(storageKeys);
    const records = [];
    for (const dateKey of dateKeys) {
      const dayRecords = Array.isArray(result[timelineStorageKeyForDate(dateKey)])
        ? result[timelineStorageKeyForDate(dateKey)]
        : [];
      for (const record of dayRecords) {
        records.push({ ...record, dateKey });
      }
    }
    return records;
  } catch {
    return [];
  }
}

async function getTodayRecords() {
  try {
    const result = await chrome.storage.local.get(timelineStorageKey());
    return Array.isArray(result[timelineStorageKey()]) ? result[timelineStorageKey()] : [];
  } catch {
    return [];
  }
}

async function saveTodayRecords(records) {
  try {
    await chrome.storage.local.set({ [timelineStorageKey()]: records });
  } catch {}
}

async function startTimelineRecord(type, content) {
  const now = Date.now();
  const records = await getTodayRecords();

  if (type === "work" && mergeNextWorkWithPrevious) {
    const previousWork = [...records].reverse().find((item) => item.type === "work");
    const sameTodo = !activeTodoContext?.id || previousWork?.todoId === activeTodoContext.id;
    if (previousWork && sameTodo) {
      previousWork.end = null;
      delete previousWork.completedNaturally;
      delete previousWork.completionReason;
      clearReviewForContinuedWork(previousWork);
      activeTimelineRecordId = previousWork.id;
      mergeNextWorkWithPrevious = false;
      await saveTodayRecords(records);
      await persistControllerHeartbeat();
      return previousWork.id;
    }
  }

  mergeNextWorkWithPrevious = false;

  const record = {
    id: `${now}-${Math.random().toString(16).slice(2)}`,
    type,
    content: content || (type === "work" ? "工作" : type === "break" ? "休息" : ""),
    note: "",
    start: now,
    end: null,
    round: timer.round,
    automatic: true,
    todoAutoCompleteEligible: type === "work",
    ...(type === "work" && activeTodoContext
      ? {
          todoId: activeTodoContext.id,
          todoUrl: activeTodoContext.url,
          todoDate: activeTodoContext.date,
          todoPlannedStart: activeTodoContext.plannedStart,
          todoPlannedEnd: activeTodoContext.plannedEnd,
        }
      : {}),
  };
  records.push(record);
  await saveTodayRecords(records);
  activeTimelineRecordId = record.id;
  await persistControllerHeartbeat();
  return record.id;
}

function clearReviewForContinuedWork(record) {
  if (!record || record.type !== "work") return;
  record.reviewPending = true;
  record.reviewSkipped = false;
  delete record.completion;
  delete record.focus;
  delete record.interruption;
  delete record.reviewNote;
}

async function finishActiveTimelineRecord(
  finalContent,
  endTimestamp = Date.now(),
  completion = {}
) {
  if (!activeTimelineRecordId) return null;

  const finishedRecordId = activeTimelineRecordId;
  const records = await getTodayRecords();
  const index = records.findIndex((item) => item.id === activeTimelineRecordId);
  const record = index >= 0 ? records[index] : null;

  if (record) {
    record.end = Math.max(record.start, Number(endTimestamp) || Date.now());
    if (finalContent && record.type === "work") {
      record.content = finalContent;
    }

    if (record.type === "work" && typeof record.reviewPending !== "boolean") {
      record.reviewPending = true;
    }

    if (record.type === "work") {
      record.completedNaturally = completion.completedNaturally === true;
      record.completionReason = String(completion.completionReason || "stopped");
    }

    const duration = Math.max(0, record.end - record.start);
    if (duration < 60 * 1000) {
      if (record.type === "break") {
        mergeNextWorkWithPrevious = true;
      }
      records.splice(index, 1);
      await saveTodayRecords(records);
      activeTimelineRecordId = null;
      await persistControllerHeartbeat();
      return null;
    }
  }

  await saveTodayRecords(records);
  activeTimelineRecordId = null;
  await persistControllerHeartbeat();
  await refreshPendingReviewCount();
  return finishedRecordId;
}

async function updateTimelineRecordContent(recordId, content, note) {
  if (!recordId) return;

  const records = await getTodayRecords();
  const record = records.find((item) => item.id === recordId);
  if (record) {
    record.content = content || record.content || defaultTimelineContent(record.type);
    if (typeof note === "string") {
      record.note = note.trim();
    }
  }
  await saveTodayRecords(records);
}

function defaultTimelineContent(type) {
  if (type === "work") return "工作";
  if (type === "break") return "休息";
  if (type === "life") return "生活";
  if (type === "entertainment") return "娱乐";
  return "记录";
}

function askText(message, defaultValue, options = {}) {
  const fallback = defaultValue || "工作";
  const withNote = Boolean(options.withNote);

  if (!pip || !pip.promptModal || !pipWindow || pipWindow.closed) {
    return Promise.resolve(withNote ? { text: fallback, note: "" } : fallback);
  }

  if (pendingPromptResolve) {
    pendingPromptResolve(fallback);
    pendingPromptResolve = null;
  }

  return new Promise((resolve) => {
    pendingPromptResolve = (value, noteValue) => {
      pendingPromptResolve = null;
      promptNoteVisible = false;
      pip.surface.classList.remove("prompt-open");
      pip.surface.classList.remove("prompt-note-open");
      const text = String(value ?? fallback).trim() || fallback;
      const note = String(noteValue ?? "").trim();
      resolve(withNote ? { text, note } : text);
    };

    pip.promptTitle.textContent = message;
    pip.promptInput.value = fallback;
    pip.promptInput.defaultValue = fallback;
    pip.promptNote.value = "";
    pip.promptNoteButton.style.display = withNote ? "" : "none";
    pip.surface.classList.add("prompt-open");
    pip.surface.classList.remove("prompt-note-open");

    setTimeout(() => {
      pip.promptInput.focus();
      pip.promptInput.select();
    }, 0);
  });
}


function recordDurationMs(record, now = Date.now()) {
  const end = record.end || now;
  return Math.max(0, end - record.start);
}

function formatDurationShort(totalMs) {
  const minutes = Math.max(0, Math.round(totalMs / 60000));
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours > 0 && rest > 0) return `${hours}小时${rest}分`;
  if (hours > 0) return `${hours}小时`;
  return `${rest}分`;
}

function playReminderTone() {
  playToneSequence([
    { frequency: 880.00, offset: 0.00, duration: 0.12, gain: 0.24, type: "triangle" },
    { frequency: 1174.66, offset: 0.15, duration: 0.12, gain: 0.24, type: "triangle" },
    { frequency: 1567.98, offset: 0.30, duration: 0.16, gain: 0.22, type: "triangle" },
  ]);
}

async function beginWorkRecord() {
  const defaultPlan = currentWorkPlan || "工作";
  await startTimelineRecord("work", defaultPlan);
  if (activeTodoContext && !activeTodoStartedNotified) {
    activeTodoStartedNotified = true;
    try {
      const response = await chrome.runtime.sendMessage({
        type: "NOTION_TODO_STARTED",
        payload: activeTodoContext,
      });
      if (response?.ok === false) activeTodoStartedNotified = false;
    } catch {
      activeTodoStartedNotified = false;
    }
  }
}

async function finishCurrentWorkRecordForTransition(completion = {}) {
  const defaultContent = currentWorkPlan || "工作";
  const hadActiveRecord = Boolean(activeTimelineRecordId);
  const finishedWorkRecordId = await finishActiveTimelineRecord(
    defaultContent,
    Date.now(),
    completion
  );
  return {
    hadActiveRecord,
    recordId: finishedWorkRecordId,
    deletedShortRecord: hadActiveRecord && !finishedWorkRecordId,
  };
}

async function beginBreakRecord() {
  const transition = await finishCurrentWorkRecordForTransition({
    completedNaturally: false,
    completionReason: "manual_break",
  });
  if (!transition.hadActiveRecord) {
    return { ...transition, startedBreak: false };
  }

  await startTimelineRecord("break", "休息");
  return { ...transition, startedBreak: true };
}

async function toggleManualBreak() {
  if (timer.finished) return;

  if (timer.phase === "break") {
    await finishBreakAndStartWork();
    render();
    showControls();
    return;
  }

  await startManualBreak();
}

async function startManualBreak() {
  if (timer.phase !== "work") return;

  const wasRunning = running;
  const transition = await beginBreakRecord();
  if (!transition.startedBreak) {
    return;
  }

  playPhaseEndTone("work");
  timer.phase = "break";
  timer.total = getBreakDurationSeconds();
  timer.remaining = timer.total;
  timer.finished = false;

  if (wasRunning) {
    playPhaseStartTone("break");
  }

  render();
  showControls();
  promptPendingReviewIfUseful("已进入休息");
}

async function finishBreakAndStartWork() {
  if (timer.phase !== "break") return;

  await finishActiveTimelineRecord();
  playPhaseEndTone("break");

  timer.round += 1;
  timer.phase = "work";
  timer.total = getWorkDurationSeconds();
  timer.remaining = timer.total;
  timer.finished = false;

  if (running) {
    await beginWorkRecord();
    playPhaseStartTone("work");
  }
}

function getWorkDurationSeconds() {
  const sourceMode = timer.sourceMode || settings.mode;
  if (sourceMode === "work") return settings.singleWorkMinutes * 60;
  return settings.cycleWorkMinutes * 60;
}

function getBreakDurationSeconds() {
  const sourceMode = timer.sourceMode || settings.mode;
  if (sourceMode === "break") return settings.singleBreakMinutes * 60;
  return settings.cycleBreakMinutes * 60;
}



function getPresenceIdleMinutes() {
  return PRESENCE_IDLE_MINUTES[settings.presenceMode] || null;
}

function clearPresenceConfirmation() {
  presencePromptOpen = false;
  idleDetectedAt = null;
  inferredInactiveAt = null;

  if (presenceConfirmTimeoutId) {
    clearTimeout(presenceConfirmTimeoutId);
    presenceConfirmTimeoutId = null;
  }

  if (pip?.surface) {
    pip.surface.classList.remove("presence-open");
  }
}

function configurePresenceDetection() {
  if (!chrome?.idle) return;

  const minutes = getPresenceIdleMinutes();
  if (!minutes) {
    clearPresenceConfirmation();
    return;
  }

  try {
    chrome.idle.setDetectionInterval(minutes * 60);
  } catch {}
}

async function confirmPresenceHere(source = "button") {
  if (!presencePromptOpen) return;

  clearPresenceConfirmation();
  setControlStatus(source === "activity"
    ? "检测到新的系统操作，已自动确认你仍在。"
    : "已确认仍在工作，番茄钟继续。");
  render();
  scheduleHideControls();
}

async function stopForPresenceLoss(reason, inactiveStart = Date.now()) {
  if (!running && !activeTimelineRecordId) {
    clearPresenceConfirmation();
    return;
  }

  const stoppedAt = Date.now();
  const inferredStart = Math.min(stoppedAt, Math.max(0, Number(inactiveStart) || stoppedAt));

  if (activeTimelineRecordId) {
    await finishActiveTimelineRecord(currentPhaseTimelineContent(), inferredStart, {
      completedNaturally: false,
      completionReason: "presence_loss",
    });
  }

  if (stoppedAt > inferredStart) {
    await addTimelineIntervalRecord(
      "leave",
      reason,
      inferredStart,
      stoppedAt,
      {
        automatic: true,
        inferredStart: true,
      }
    );
  }

  running = false;
  stopTick();
  activeTimelineRecordId = null;
  timer = createTimerFromSettings();
  updateWebsiteBlocking();
  clearPresenceConfirmation();

  if (pip?.status) {
    pip.status.textContent = "已自动停止";
  }

  render();
  showControls();
  await refreshPendingReviewCount();
  setControlStatus(`番茄钟已自动停止：${reason}`);
}

async function confirmPresenceAway() {
  if (!presencePromptOpen) return;

  const reason = await askText("请输入离开原因：", "长时间无操作，确认离开");
  const start = inferredInactiveAt || idleDetectedAt || Date.now();
  await stopForPresenceLoss(reason || "长时间无操作，确认离开", start);
}

function showPresenceConfirmation(idleEventTime) {
  if (!running || timer.finished || settings.presenceMode === "off") return;
  if (presencePromptOpen) return;

  const idleMinutes = getPresenceIdleMinutes();
  if (!idleMinutes) return;

  idleDetectedAt = Number(idleEventTime) || Date.now();
  inferredInactiveAt = Math.max(0, idleDetectedAt - idleMinutes * 60 * 1000);
  presencePromptOpen = true;

  if (pip?.presenceMessage) {
    pip.presenceMessage.textContent =
      `系统已连续约 ${idleMinutes} 分钟没有输入。若 2 分钟内没有确认，当前番茄钟将自动停止。`;
  }

  if (pip?.surface) {
    pip.surface.classList.add("presence-open");
  }

  playReminderTone();
  showControls();

  presenceConfirmTimeoutId = setTimeout(() => {
    presenceConfirmTimeoutId = null;
    stopForPresenceLoss(
      "长时间无操作，未确认在场",
      inferredInactiveAt || idleDetectedAt || Date.now()
    );
  }, PRESENCE_CONFIRM_TIMEOUT_MS);
}

async function handleIdleStateChange(state) {
  if (settings.presenceMode === "off") return;

  if (state === "locked") {
    const inactiveStart = inferredInactiveAt || Date.now();
    await stopForPresenceLoss("系统锁屏自动停止", inactiveStart);
    return;
  }

  if (state === "idle") {
    showPresenceConfirmation(Date.now());
    return;
  }

  if (state === "active" && presencePromptOpen) {
    await confirmPresenceHere("activity");
  }
}

async function getPendingReviewRecords() {
  const records = await getTodayRecords();
  return records
    .filter((record) => record.type === "work" && record.end && record.reviewPending === true)
    .sort((a, b) => (b.end || b.start || 0) - (a.end || a.start || 0));
}

async function refreshPendingReviewCount() {
  const pending = await getPendingReviewRecords();
  pendingReviewCount = pending.length;
  if (pip?.reviewBtn) {
    pip.reviewBtn.classList.toggle("has-pending", pendingReviewCount > 0);
    pip.reviewBtn.innerHTML = globalThis.PersonalSystemUI?.icon("square-pen")?.outerHTML || "";
    pip.reviewBtn.title = pendingReviewCount > 0 ? `补充完成情况（${pendingReviewCount} 条待填写）` : "补充完成情况";
    pip.reviewBtn.setAttribute("aria-label", pip.reviewBtn.title);
    pip.reviewBtn.title = pendingReviewCount > 0
      ? `补充工作评价：${pendingReviewCount} 条待评价`
      : "补充工作评价";
  }
}

function describeReviewRecord(record) {
  if (!record) return "暂无待评价记录";
  const start = new Date(record.start);
  const end = new Date(record.end || Date.now());
  const hhmm = (date) => `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  return `${hhmm(start)}-${hhmm(end)} · ${record.content || "工作"} · ${formatDurationShort(recordDurationMs(record))}`;
}

async function openReviewPanel() {
  const pending = await getPendingReviewRecords();
  const record = pending[0];

  if (!record) {
    await refreshPendingReviewCount();
    setControlStatus("当前没有待评价的工作记录。");
    return;
  }

  activeReviewRecordId = record.id;
  pip.reviewRecordMeta.textContent = describeReviewRecord(record);
  pip.reviewNote.value = record.reviewNote || "";
  pip.surface.classList.add("review-open");
  if (pip.reviewScroll) {
    pip.reviewScroll.scrollTop = 0;
  }
  pip.reviewNote.focus();
  showControls();
}

function closeReviewPanel() {
  if (!pip) return;
  pip.surface.classList.remove("review-open");
  activeReviewRecordId = null;
}

async function saveReviewPanel(skip = false) {
  if (reviewSaveInFlight) return;
  if (!activeReviewRecordId) {
    closeReviewPanel();
    return;
  }
  reviewSaveInFlight = true;

  const records = await getTodayRecords();
  const record = records.find((item) => item.id === activeReviewRecordId);

  if (record) {
    record.reviewPending = false;
    if (skip) {
      record.reviewSkipped = true;
    } else {
      record.reviewNote = String(pip.reviewNote.value || "").trim();
      record.reviewSkipped = false;
    }
  }

  try {
    await saveTodayRecords(records);
  } catch (error) {
    reviewSaveInFlight = false;
    setControlStatus(error?.message || "工作评价保存失败。");
    return;
  }

  closeReviewPanel();
  setControlStatus(skip ? "已跳过本条工作评价。" : "工作评价已保存。");
  reviewSaveInFlight = false;

  refreshPendingReviewCount()
    .then(() => pendingReviewCount <= 0 ? cancelGlobalReviewReminder() : scheduleGlobalReviewReminder(false))
    .catch(() => {});
  if (!skip) syncPomodoroReviewsToCompletionInBackground(dateKeyFromDate(new Date()));
}

function syncPomodoroReviewsToCompletionInBackground(dateKey) {
  chrome.runtime.sendMessage({
    type: "SYNC_POMODORO_REVIEWS_TO_COMPLETION",
    payload: { dateKey },
  }).catch(() => null);
}

async function scheduleGlobalReviewReminder(immediate = false) {
  try {
    await chrome.runtime.sendMessage({
      type: "SCHEDULE_REVIEW_REMINDER",
      payload: { immediate, delayMinutes: 5 },
    });
  } catch {}
}

async function cancelGlobalReviewReminder() {
  try {
    await chrome.runtime.sendMessage({ type: "CANCEL_REVIEW_REMINDER" });
  } catch {}
}

async function triggerReviewPrompt(reason = "番茄钟已完成") {
  await refreshPendingReviewCount();
  if (pendingReviewCount <= 0) {
    await cancelGlobalReviewReminder();
    return;
  }

  playReminderTone();
  setControlStatus(`${reason}，请填写工作评价。`);

  if (pip) {
    await openReviewPanel();
  }

  await scheduleGlobalReviewReminder(true);
}

async function postponeReviewPrompt() {
  closeReviewPanel();
  setControlStatus("已设为稍后评价，5分钟后再次提醒。");
  await scheduleGlobalReviewReminder(false);
}

async function promptPendingReviewIfUseful(reason) {
  await refreshPendingReviewCount();
  if (pendingReviewCount <= 0) return;
  const actionText = reason ? `${reason}，` : "";
  setControlStatus(`${actionText}还有 ${pendingReviewCount} 条工作记录待评价，可点击“评”补充。`);
}

async function addTimelineIntervalRecord(type, content, start, end, extra = {}) {
  const records = await getTodayRecords();
  const safeStart = Number(start) || Date.now();
  const safeEnd = Math.max(safeStart, Number(end) || safeStart);
  records.push({
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    type,
    content: content || defaultTimelineContent(type),
    note: "",
    start: safeStart,
    end: safeEnd,
    round: timer.round,
    ...extra,
  });
  await saveTodayRecords(records);
}

async function startInstantTimelineRecord(type, content) {
  const now = Date.now();
  const records = await getTodayRecords();
  records.push({
    id: `${now}-${Math.random().toString(16).slice(2)}`,
    type,
    content,
    start: now,
    end: now,
    round: timer.round,
  });
  await saveTodayRecords(records);
}

function currentPhaseTimelineContent() {
  if (timer.phase === "work") return currentWorkPlan || "工作";
  if (timer.phase === "break") return "休息";
  return "记录";
}

function clearLeaveThresholdTimer() {
  if (leaveThresholdTimeoutId) {
    clearTimeout(leaveThresholdTimeoutId);
    leaveThresholdTimeoutId = null;
  }
}

function markLeaveAsLong() {
  if (!leaveState) return;
  leaveState.isLong = true;
  leaveThresholdTimeoutId = null;
  setControlStatus("离开已超过10分钟；继续时将结束旧番茄钟并开始全新番茄钟。");
  render();
  showControls();
}

async function appendShortLeaveInterruption(recordId, start, end, reason) {
  if (!recordId) return;

  const records = await getTodayRecords();
  const record = records.find((item) => item.id === recordId);
  if (!record) return;

  const interruptions = Array.isArray(record.interruptions)
    ? record.interruptions
    : [];

  interruptions.push({
    start,
    end,
    durationMs: Math.max(0, end - start),
    reason: reason || "短暂离开",
    category: "short_leave",
  });

  record.interruptions = interruptions;
  await saveTodayRecords(records);
}

function boundedLongLeaveInterval(startTimestamp, returnTimestamp) {
  const start = Number(startTimestamp) || Date.now();
  const returned = Math.max(start, Number(returnTimestamp) || start);
  const startDate = new Date(start);
  const hour = startDate.getHours() + startDate.getMinutes() / 60;

  if (hour >= 9 && hour < 22) {
    const dayEnd = new Date(startDate);
    dayEnd.setHours(22, 0, 0, 0);
    return {
      start,
      end: Math.min(returned, dayEnd.getTime()),
    };
  }

  return {
    start,
    end: Math.min(returned, start + 60 * 60 * 1000),
  };
}

async function resolveLeaveAndResume() {
  if (!leaveState) return false;

  const state = leaveState;
  const returnedAt = Date.now();
  const duration = Math.max(0, returnedAt - state.startedAt);
  const reason = await askText("请输入本次离开理由：", "临时离开");

  clearLeaveThresholdTimer();
  leaveState = null;

  if (duration <= SHORT_LEAVE_THRESHOLD_MS && !state.isLong) {
    await appendShortLeaveInterruption(
      state.recordId,
      state.startedAt,
      returnedAt,
      reason || "短暂离开"
    );

    running = true;
    stopTick();
    tickId = setInterval(async () => {
      timer.remaining = Math.max(0, timer.remaining - 1);
      if (timer.remaining <= 0) {
        await advanceOrFinish();
      }
      render();
    }, 1000);

    setControlStatus(
      `已继续原番茄钟；短暂离开 ${formatDurationShort(duration)} 已记录为打断信息。`
    );
    updateWebsiteBlocking();
    render();
    scheduleHideControls();
    return true;
  }

  if (activeTimelineRecordId) {
    await finishActiveTimelineRecord(currentPhaseTimelineContent(), state.startedAt, {
      completedNaturally: false,
      completionReason: "long_leave",
    });
  }

  const interval = boundedLongLeaveInterval(state.startedAt, returnedAt);
  if (interval.end - interval.start >= 60 * 1000) {
    await addTimelineIntervalRecord(
      "life",
      reason || "长时间离开",
      interval.start,
      interval.end,
      {
        leaveDurationMs: duration,
        boundedLeave: true,
      }
    );
  }

  activeTimelineRecordId = null;
  running = false;
  stopTick();
  timer = createTimerFromSettings();

  setControlStatus(
    "离开超过10分钟，旧番茄钟已结束；现在开始一个全新的完整番茄钟。"
  );

  await start();
  return true;
}

async function beginLeave() {
  if (!running || timer.finished || leaveState) return;

  leaveState = {
    startedAt: Date.now(),
    remainingAtLeave: timer.remaining,
    phase: timer.phase,
    recordId: activeTimelineRecordId,
    isLong: false,
  };

  running = false;
  stopTick();
  clearLeaveThresholdTimer();
  leaveThresholdTimeoutId = setTimeout(markLeaveAsLong, SHORT_LEAVE_THRESHOLD_MS);

  setControlStatus("番茄钟已暂停。点击继续即表示归来，并填写离开理由。");
  updateWebsiteBlocking();
  render();
  showControls();
}

function toggleLeaveState() {
  beginLeave();
}

async function openTimelinePage() {
  await promptPendingReviewIfUseful("打开时间轴前");
  try {
    await chrome.tabs.create({
      url: chrome.runtime.getURL("timeline.html"),
      active: true,
    });
  } catch {}
}

async function stopPomodoroForAccess(site, reason) {
  await finishActiveTimelineRecord(
    `因访问申请停止：${site || ""} ${reason || ""}`.trim(),
    Date.now(),
    {
      completedNaturally: false,
      completionReason: "access_request",
    }
  );
  running = false;
  timer.finished = true;
  stopTick();
  updateWebsiteBlocking();
  render();
}

function supportsDocumentPiP() {
  const hostWindow = mainPageMode && window.top !== window ? window.top : window;
  return "documentPictureInPicture" in hostWindow &&
    typeof hostWindow.documentPictureInPicture.requestWindow === "function";
}

async function openPip() {
  if (!supportsDocumentPiP()) {
    showPipUnavailable("当前浏览器环境不支持 Document Picture-in-Picture，无法打开置顶小窗。");
    return;
  }

  try {
    if (pipWindow && pipWindow !== window && !pipWindow.closed) {
      pipWindow.focus?.();
      return;
    }

    // Opening/restoring the PiP should not reset an active Pomodoro.
    if (!hasActiveTimerState() && (timer.finished || timer.remaining <= 0)) {
      timer = createTimerFromSettings();
      running = false;
      stopTick();
    }

    settingsVisible = false;
    intentionalPipClose = false;
    setControlStatus("");

    cleanupAdaptiveLayout();
    const hostWindow = mainPageMode && window.top !== window ? window.top : window;
    const floatingWindow = await hostWindow.documentPictureInPicture.requestWindow({
      width: 520,
      height: 300,
    });

    pipWindow = floatingWindow;
    buildPipDocument(floatingWindow.document);
    if (mainPageMode) mainControllerDocument.body.classList.add("pip-detached");
    const compactHost = mainPageMode && window.top !== window && new URLSearchParams(window.top.location.search).get("compact") === "1";
    if (compactHost) {
      chrome.windows.getCurrent((host) => {
        if (host?.id) chrome.windows.update(host.id, { state: "minimized" }).catch(() => null);
      });
    }
    floatingWindow.addEventListener("pagehide", async () => {
      if (pendingPromptResolve) {
        pendingPromptResolve(currentWorkPlan || "工作", "");
      }

      cleanupAdaptiveLayout();
      if (mainPageMode && mainControllerDocument.defaultView) {
        mainControllerDocument.body.classList.remove("pip-detached");
        pipWindow = window;
        buildPipDocument(mainControllerDocument, { mainPage: true });
        intentionalPipClose = false;
        setControlStatus("已从置顶小窗返回番茄钟页面。");
        if (compactHost) {
          chrome.windows.getCurrent((host) => {
            if (host?.id) chrome.windows.update(host.id, { state: "normal", focused: true }).catch(() => null);
          });
        }
        render();
      } else {
        pipWindow = null;
        pip = null;
        await stopAll();
        timer = createTimerFromSettings();
        intentionalPipClose = false;
        setControlStatus("番茄钟小窗已关闭，当前计时已全部停止。");
      }
    });

    render();
    if (pendingTodoAutoStart && activeTodoContext && isTimerFreshAndIdle()) {
      pendingTodoAutoStart = false;
      await start();
      setControlStatus(`已开始待办：${currentWorkPlan}`);
    }
  } catch (error) {
    showPipUnavailable("置顶小窗打开失败。请确认 Edge/Chrome 版本支持 Document Picture-in-Picture。");
    console.warn(error);
  }
}

function showPipUnavailable(message) {
  if (pip?.mainPageStatus) {
    pip.mainPageStatus.textContent = message;
    pip.mainPageStatus.classList.add("visible");
    return;
  }
  if (fallback) {
    fallback.textContent = message;
    fallback.classList.add("visible");
  }
}

function buildPipDocument(doc, { mainPage = false } = {}) {
  doc.head.innerHTML = `
    <meta charset="utf-8" />
    <title>个人系统 · 番茄钟</title>
    <style>
      :root {
        --bg: #090b0f;
        --text: #f2f4f7;
        --muted: rgba(215,222,230,0.64);
        --line: rgba(255,255,255,0.10);
        --track: rgba(255,255,255,0.16);
        --fill: #f2f4f7;
        --button-bg: rgba(20,24,30,0.88);
        --settings-bg: rgba(15,18,23,0.98);
        --shadow: rgba(0,0,0,0.58);
      }

      * {
        box-sizing: border-box;
        user-select: none;
      }

      html,
      body {
        width: 100%;
        height: 100%;
        margin: 0;
        overflow: hidden;
        background: var(--bg);
        color: var(--text);
        font-family: "Segoe UI Variable Text", "Segoe UI", "Microsoft YaHei UI", Inter, system-ui, sans-serif;
      }

      button,
      input {
        font: inherit;
      }

      button:focus-visible,
      input:focus-visible,
      textarea:focus-visible,
      select:focus-visible {
        outline: 2px solid #9bd8ff;
        outline-offset: 2px;
      }

      .surface {
        position: relative;
        width: 100vw;
        height: 100vh;
        overflow: hidden;
        border-radius: 0;
        background: var(--bg);
        color: var(--text);
        outline: none;
      }

      .main-pomodoro-toolbar {
        position: absolute;
        top: 18px;
        right: 20px;
        z-index: 45;
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .surface.main-page .main-pomodoro-toolbar {
        display: flex;
      }

      .surface:not(.main-page) .pin-window-button,
      .surface:not(.main-page) .main-page-status {
        display: none;
      }

      body.pip-detached .surface::after {
        content: "番茄钟正在置顶小窗中运行";
        position: absolute;
        inset: 0;
        z-index: 80;
        display: grid;
        place-items: center;
        color: var(--muted);
        background: var(--bg);
        font-size: 16px;
        font-weight: 800;
        letter-spacing: 0.02em;
      }

      .pin-window-button {
        min-height: 38px;
        padding: 0 15px;
        border: 1px solid rgba(131,197,255,0.34);
        border-radius: 10px;
        color: #dff3ff;
        background: rgba(103,183,255,0.12);
        font-size: 12px;
        font-weight: 850;
        cursor: pointer;
      }

      .pin-window-button:hover {
        border-color: rgba(131,197,255,0.58);
        background: rgba(103,183,255,0.19);
      }

      .main-page-status {
        display: none;
        max-width: 340px;
        color: #ffc0ca;
        font-size: 12px;
      }

      .main-page-status.visible { display: block; }

      .surface.main-page .work-title-bar {
        top: 32px;
      }

      @media (min-width: 900px) and (min-height: 520px) {
        .surface.main-page .work-title-display {
          width: min(520px, calc(100vw - 360px));
          height: 42px;
          font-size: 15px;
        }
      }


      .work-title-bar {
        position: absolute;
        left: 16px;
        right: 16px;
        top: 10px;
        z-index: 9;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        pointer-events: none;
      }

      .surface.short .work-title-bar {
        top: 7px;
        left: 12px;
        right: 12px;
      }

      .work-title-display {
        width: min(360px, calc(100vw - 88px));
        max-width: calc(100% - 24px);
        min-height: 34px;
        display: grid;
        place-items: center;
        border: 1px solid var(--line);
        border-radius: 10px;
        color: var(--text);
        background: rgba(255,255,255,0.035);
        box-shadow: none;
        outline: none;
        padding: 0 15px;
        text-align: center;
        font-size: 13px;
        font-weight: 800;
        letter-spacing: -0.018em;
        opacity: 0.88;
        pointer-events: none;
        backdrop-filter: blur(10px);
      }

      .surface.break-mode .work-title-display {
        opacity: 0.62;
      }

      .surface.short .work-title-display {
        min-height: 28px;
        font-size: 12px;
        padding: 0 11px;
      }

      .surface.very-narrow .work-title-display {
        width: calc(100vw - 112px);
      }

      .work-title-meta {
        min-height: 15px;
        color: var(--muted);
        font-size: 11px;
        font-weight: 700;
        letter-spacing: -0.01em;
        opacity: 0.78;
        text-align: center;
        pointer-events: none;
        max-width: calc(100vw - 24px);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .surface.short .work-title-meta,
      .surface.very-narrow .work-title-meta {
        display: none;
      }

      .time-wrap {
        position: absolute;
        left: 0;
        right: 0;
        top: 52px;
        bottom: 52px;
        display: grid;
        place-items: center;
        padding: 0 16px;
        overflow: hidden;
      }

      .surface.short .time-wrap {
        top: 38px;
        bottom: 46px;
      }

      .surface.tiny-height .time-wrap {
        top: 32px;
        bottom: 40px;
      }

      .time {
        display: grid;
        grid-template-columns: min-content min-content;
        align-items: center;
        justify-content: center;
        column-gap: 0.18em;
        width: max-content;
        max-width: none;
        font-size: 132px;
        line-height: 0.84;
        font-weight: 900;
        letter-spacing: -0.02em;
        text-shadow: 0 16px 34px rgba(0,0,0,0.52);
        transform-origin: center center;
        will-change: font-size, transform;
      }

      .pair {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.055em;
      }

      .digit {
        display: inline-block;
        width: 0.62em;
        text-align: center;
      }

      .center-play {
        position: absolute;
        inset: 0;
        display: grid;
        place-items: center;
        opacity: 0;
        pointer-events: none;
        transition: opacity 160ms ease;
      }

      .surface.paused .center-play,
      .surface.controls-visible.paused .center-play {
        opacity: 1;
        pointer-events: auto;
      }

      .surface.running .center-play {
        opacity: 0;
        pointer-events: none;
      }

      .play-button {
        width: 74px;
        height: 74px;
        display: grid;
        place-items: center;
        border: 1px solid rgba(255,255,255,0.18);
        border-radius: 50%;
        color: var(--text);
        background: rgba(20,24,30,0.90);
        box-shadow: 0 14px 34px rgba(0,0,0,0.30);
        backdrop-filter: blur(8px);
        cursor: pointer;
        transition: transform 140ms ease, box-shadow 140ms ease;
      }

      .play-button svg {
        width: 32px;
        height: 32px;
        fill: currentColor;
      }

      .controls {
        position: absolute;
        left: 10px;
        right: 10px;
        bottom: 8px;
        z-index: 10;
        opacity: 0;
        transform: translateY(12px);
        transition: opacity 160ms ease, transform 160ms ease;
        pointer-events: none;
      }

      .surface.controls-visible .controls,
      .surface.paused .controls,
      .surface.settings-open .controls {
        opacity: 1;
        transform: translateY(0);
        pointer-events: auto;
      }

      .bar-row {
        min-height: 36px;
        display: flex;
        align-items: center;
        gap: 7px;
        min-width: 0;
        overflow: hidden;
        padding: 6px 7px;
        border: 1px solid var(--line);
        border-radius: 12px;
        background: rgba(16,20,25,0.88);
        box-shadow: 0 12px 28px rgba(0,0,0,0.24);
        backdrop-filter: blur(8px);
      }

      .surface.narrow .bar-row {
        gap: 5px;
      }

      .surface.very-narrow .bar-row {
        gap: 4px;
      }

      .mini-icon,
      .text-btn {
        height: 26px;
        border: 1px solid rgba(255,255,255,0.15);
        border-radius: 8px;
        color: var(--text);
        background: var(--button-bg);
        box-shadow: none;
        cursor: pointer;
        transition: transform 140ms ease, border-color 140ms ease, background 140ms ease, box-shadow 140ms ease;
      }

      .mini-icon {
        width: 32px;
        min-width: 32px;
        display: grid;
        place-items: center;
      }

      .surface.narrow .mini-icon {
        width: 28px;
        min-width: 28px;
      }

      .surface.very-narrow .mini-icon {
        width: 26px;
        min-width: 26px;
        height: 22px;
        font-size: 11px;
      }

      .mini-icon svg {
        width: 14px;
        height: 14px;
        fill: currentColor;
      }

      .text-btn {
        padding: 0 10px;
        font-size: 11px;
        font-weight: 800;
      }

      .mini-icon:hover,
      .text-btn:hover {
        color: #fff;
        border-color: rgba(255,255,255,0.20);
        background: rgba(255,255,255,0.07);
        transform: translateY(-1px);
        box-shadow: none;
      }

      .status {
        flex: 1 1 auto;
        min-width: 0;
        margin-right: auto;
        color: var(--muted);
        font-size: 12px;
        font-weight: 800;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .surface.narrow .status {
        font-size: 11px;
      }

      .surface.very-narrow .status {
        display: none;
      }

      .time-note {
        flex: 0 1 auto;
        min-width: 0;
        color: var(--muted); opacity: 0.58;
        font-size: 11px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .surface.narrow .time-note {
        display: none;
      }

      .volume-pop {
        position: absolute;
        right: 42px;
        bottom: 40px;
        width: 188px;
        padding: 12px;
        border: 1px solid rgba(255,255,255,0.13);
        border-radius: 12px;
        background: var(--settings-bg);
        box-shadow: 0 20px 50px rgba(0,0,0,0.45);
        display: none;
      }

      .volume-pop.visible {
        display: block;
      }

      .volume-pop label {
        display: flex;
        justify-content: space-between;
        color: var(--muted);
        font-size: 12px;
        margin-bottom: 10px;
      }

      .volume-range {
        display: block;
        width: 100%;
        height: 18px;
        margin: 0;
        appearance: none;
        -webkit-appearance: none;
        background: transparent;
        cursor: pointer;
      }

      .volume-range::-webkit-slider-runnable-track {
        height: 4px;
        border-radius: 999px;
        background:
          linear-gradient(
            90deg,
            var(--fill) 0%,
            var(--fill) var(--volume-percent, 75%),
            var(--track) var(--volume-percent, 75%),
            var(--track) 100%
          );
      }

      .volume-range::-webkit-slider-thumb {
        appearance: none;
        -webkit-appearance: none;
        width: 14px;
        height: 14px;
        margin-top: -5px;
        border-radius: 50%;
        background: #eeeeee;
        box-shadow: 0 0 0 5px rgba(255,255,255,0.14);
      }

      @media (max-width: 330px) {
        .status {
          max-width: 120px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      }

      .prompt-modal {
        position: absolute;
        inset: 0;
        z-index: 40;
        display: none;
        place-items: center;
        padding: 18px;
        background: rgba(0,0,0,0.48);
        backdrop-filter: blur(6px);
      }

      .surface.prompt-open .prompt-modal {
        display: grid;
      }

      .prompt-card {
        width: min(360px, 100%);
        border: 1px solid var(--line);
        border-radius: 14px;
        background: var(--settings-bg);
        box-shadow: 0 24px 80px var(--shadow);
        padding: 16px;
      }

      .prompt-title {
        margin: 0 0 10px;
        color: var(--text);
        font-size: 14px;
        font-weight: 900;
        line-height: 1.45;
      }

      .prompt-input {
        width: 100%;
        height: 38px;
        border: 1px solid rgba(255,255,255,0.13);
        border-radius: 10px;
        color: var(--text);
        background: var(--button-bg);
        outline: none;
        padding: 0 11px;
      }

      .prompt-actions {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        margin-top: 12px;
      }

      .prompt-note {
        display: none;
        width: 100%;
        min-height: 92px;
        margin-top: 10px;
        border: 1px solid rgba(255,255,255,0.13);
        border-radius: 10px;
        color: var(--text);
        background: var(--button-bg);
        outline: none;
        padding: 9px 11px;
        resize: vertical;
        line-height: 1.55;
      }

      .surface.prompt-note-open .prompt-note {
        display: block;
      }

      .presence-modal {
        position: absolute;
        inset: 0;
        z-index: 28;
        display: none;
        place-items: center;
        padding: 18px;
        background: rgba(0,0,0,0.56);
        backdrop-filter: blur(7px);
      }

      .surface.presence-open .presence-modal {
        display: grid;
      }

      .presence-card {
        width: min(390px, 100%);
        border: 1px solid var(--line);
        border-radius: 14px;
        background: var(--settings-bg);
        box-shadow: 0 24px 80px var(--shadow);
        padding: 17px;
      }

      .presence-title {
        margin: 0 0 8px;
        color: var(--text);
        font-size: 16px;
        font-weight: 900;
      }

      .presence-message {
        margin: 0;
        color: var(--muted);
        font-size: 13px;
        line-height: 1.6;
      }

      .presence-actions {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        margin-top: 15px;
      }

      .review-modal {
        position: absolute;
        inset: 0;
        z-index: 24;
        display: none;
        place-items: center;
        min-width: 0;
        min-height: 0;
        padding: clamp(8px, 4vh, 18px);
        overflow: hidden;
        background: rgba(0,0,0,0.50);
        backdrop-filter: blur(6px);
      }

      .surface.review-open .review-modal {
        display: grid;
      }

      .review-card {
        width: min(390px, 100%);
        max-height: calc(100vh - clamp(16px, 8vh, 36px));
        min-height: 0;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        border: 1px solid var(--line);
        border-radius: 14px;
        background: var(--settings-bg);
        box-shadow: 0 24px 80px var(--shadow);
        padding: 16px;
      }

      .review-scroll {
        min-height: 0;
        flex: 1 1 auto;
        overflow-y: auto;
        overflow-x: hidden;
        overscroll-behavior: contain;
        scrollbar-width: thin;
        scrollbar-color: var(--muted) transparent;
        padding-right: 5px;
      }

      .review-scroll::-webkit-scrollbar {
        width: 7px;
      }

      .review-scroll::-webkit-scrollbar-track {
        background: transparent;
      }

      .review-scroll::-webkit-scrollbar-thumb {
        border-radius: 999px;
        background: rgba(215,222,230,0.32);
      }

      .review-card > .prompt-actions {
        flex: 0 0 auto;
        margin-top: 10px;
        padding-top: 10px;
        border-top: 1px solid var(--line);
        background: var(--settings-bg);
      }

      .review-record {
        margin: -4px 0 12px;
        color: var(--muted);
        font-size: 12px;
        line-height: 1.45;
      }

      .review-note {
        width: 100%;
        min-height: 70px;
        margin-top: 10px;
        border: 1px solid rgba(255,255,255,0.13);
        border-radius: 10px;
        color: var(--text);
        background: var(--button-bg);
        outline: none;
        padding: 9px 11px;
        resize: vertical;
        line-height: 1.55;
      }

      @media (max-height: 360px) {
        .review-card {
          padding: 12px;
          border-radius: 12px;
        }

        .review-record {
          margin-bottom: 8px;
        }

        .review-note {
          min-height: 52px;
          margin-top: 8px;
        }

        .review-card > .prompt-actions {
          margin-top: 7px;
          padding-top: 7px;
        }
      }

      .mini-icon.review-task {
        color: #e8f8ff;
        border-color: rgba(107,213,255,0.30);
        background: rgba(107,213,255,0.08);
        font-size: 12px;
        font-weight: 900;
      }

      .mini-icon.review-task.has-pending {
        color: #020712;
        border-color: rgba(107,213,255,0.80);
        background: #6bd5ff;
      }

      .settings {
        position: absolute;
        inset: 12px;
        z-index: 20;
        padding: 16px;
        border: 1px solid rgba(255,255,255,0.13);
        border-radius: 12px;
        background: var(--settings-bg);
        box-shadow: 0 24px 80px var(--shadow);
        opacity: 0;
        transform: translateY(8px) scale(0.985);
        pointer-events: none;
        transition: opacity 160ms ease, transform 160ms ease;
        overflow-y: auto;
        overscroll-behavior: contain;
        scrollbar-width: thin;
        scrollbar-color: var(--muted) transparent;
      }

      .settings::-webkit-scrollbar {
        width: 8px;
      }

      .settings::-webkit-scrollbar-track {
        background: transparent;
      }

      .settings::-webkit-scrollbar-thumb {
        background: var(--line);
        border-radius: 999px;
      }

      .surface.settings-open .settings {
        opacity: 1;
        transform: translateY(0) scale(1);
        pointer-events: auto;
      }

      .settings-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 12px;
      }

      .settings-title {
        margin: 0;
        font-size: 15px;
        font-weight: 900;
      }

      .close-btn {
        width: 28px;
        height: 28px;
        border: 1px solid rgba(255,255,255,0.12);
        border-radius: 50%;
        color: var(--text);
        background: var(--button-bg);
        cursor: pointer;
      }

      .mode-buttons {
        display: grid;
        gap: 8px;
        margin-bottom: 12px;
      }

      .mode-buttons {
        grid-template-columns: repeat(3, 1fr);
      }

      .mode-choice {
        min-height: 34px;
        padding: 0 8px;
        border: 1px solid rgba(255,255,255,0.13);
        border-radius: 10px;
        color: var(--muted);
        background: var(--button-bg);
        cursor: pointer;
        font-size: 11px;
        font-weight: 900;
      }

      .mode-choice.active {
        color: var(--bg);
        background: var(--text);
        border-color: var(--text);
      }

      .grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px 12px;
      }

      .field {
        display: grid;
        gap: 5px;
      }

      .field.wide {
        grid-column: span 2;
      }

      .field label {
        color: var(--muted);
        font-size: 11px;
        font-weight: 800;
      }

      .field input,
      .field textarea,
      .field select {
        width: 100%;
        border: 1px solid rgba(255,255,255,0.13);
        border-radius: 9px;
        color: var(--text);
        background: var(--button-bg);
        outline: none;
        padding: 0 10px;
      }

      .field input,
      .field select {
        height: 32px;
      }

      .field textarea {
        min-height: 58px;
        padding-top: 8px;
        padding-bottom: 8px;
        resize: vertical;
        line-height: 1.45;
      }

      .toggle-line {
        min-height: 32px;
        display: flex;
        align-items: center;
        gap: 8px;
        color: var(--text);
        font-size: 12px;
        font-weight: 800;
      }

      .toggle-line input {
        width: 16px;
        height: 16px;
      }

      .settings-actions {
        position: sticky;
        bottom: -16px;
        z-index: 2;
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 7px;
        margin-top: 12px;
        padding: 10px 0 16px;
        background: var(--settings-bg);
        box-shadow: 0 -10px 22px var(--settings-bg);
      }

      .settings-actions > button {
        width: 100%;
        min-width: 0;
        height: auto;
        min-height: 34px;
        padding: 5px 7px;
        line-height: 1.15;
        white-space: normal;
      }

      .apply {
        height: 32px;
        padding: 0 12px;
        border: 0;
        border-radius: 999px;
        color: var(--bg);
        background: var(--text);
        font-weight: 900;
        cursor: pointer;
      }

      .ghost {
        height: 32px;
        padding: 0 12px;
        border: 1px solid rgba(255,255,255,0.13);
        border-radius: 999px;
        color: var(--muted);
        background: var(--button-bg);
        font-weight: 800;
        cursor: pointer;
      }

      @media (max-width: 390px) {
        .pair {
          gap: 0.065em;
        }

        .time-note {
          display: none;
        }

        .mode-buttons {
          grid-template-columns: 1fr;
        }

        .grid {
          grid-template-columns: 1fr;
        }

        .field.wide {
          grid-column: span 1;
        }

        .settings-actions {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }

      @media (max-height: 210px) {
        .time-wrap {
          padding-left: 12px;
          padding-right: 12px;
        }
      }
    </style>
    <link rel="stylesheet" href="${chrome.runtime.getURL("design-tokens.css")}" />
    <link rel="stylesheet" href="${chrome.runtime.getURL("timer.css")}" />
  `;

  doc.body.innerHTML = `
    <main class="surface${mainPage ? " main-page" : ""} paused controls-visible" id="surface" tabindex="0">
      <header class="timer-brand app-brand"><span class="brand-mark" data-icon="panels-top-left" aria-hidden="true"></span><strong>个人系统</strong></header>

      <section class="main-pomodoro-toolbar" aria-label="置顶小窗操作">
        <span class="main-page-status" id="mainPageStatus"></span>
        <button class="pin-window-button" id="fullWorkspaceButton" type="button">完整工作台</button>
        <button class="pin-window-button" id="pinWindowButton" type="button">打开置顶小窗</button>
      </section>

      <section class="work-title-bar" aria-label="current work title">
        <div class="work-title-display" id="workTitleDisplay">工作</div>
        <div class="work-title-meta" id="workTitleMeta"></div>
      </section>

      <section class="time-wrap" aria-label="timer">
        <div class="time" id="timeDisplay">
          <span class="pair" id="minutePair">
            <span class="digit" id="m1">2</span>
            <span class="digit" id="m2">5</span>
          </span>
          <span class="time-colon" aria-hidden="true">:</span>
          <span class="pair" id="secondPair">
            <span class="digit" id="s1">0</span>
            <span class="digit" id="s2">0</span>
          </span>
        </div>
      </section>

      <section class="center-play">
        <button class="play-button" id="centerPlay" type="button" aria-label="开始或暂停">
          <span id="centerIcon"></span>
        </button>
      </section>

      <section class="prompt-modal" id="promptModal" aria-label="input prompt">
        <div class="prompt-card">
          <p class="prompt-title" id="promptTitle">请输入内容</p>
          <input class="prompt-input" id="promptInput" type="text" />
          <textarea class="prompt-note" id="promptNote" placeholder="备注：可以写更详细的说明，可不填"></textarea>
          <div class="prompt-actions">
            <button class="ghost" id="promptNoteButton" type="button">备注</button>
            <button class="ghost" id="promptCancel" type="button">使用默认</button>
            <button class="apply" id="promptOk" type="button">确定</button>
          </div>
        </div>
      </section>

      <section class="presence-modal" id="presenceModal" aria-label="presence confirmation">
        <div class="presence-card">
          <p class="presence-title">你还在工作吗？</p>
          <p class="presence-message" id="presenceMessage">
            检测到系统长时间无操作。若 2 分钟内没有确认，当前番茄钟将自动停止。
          </p>
          <div class="presence-actions">
            <button class="ghost" id="presenceAway" type="button">已经离开</button>
            <button class="apply" id="presenceHere" type="button">还在</button>
          </div>
        </div>
      </section>

      <section class="review-modal" id="reviewModal" aria-label="work review">
        <div class="review-card">
          <div class="review-scroll" id="reviewScroll">
            <p class="prompt-title">完成情况</p>
            <div class="review-record" id="reviewRecordMeta">暂无待评价记录</div>

            <textarea class="review-note" id="reviewNote" aria-label="完成情况" placeholder="记录实际完成的内容"></textarea>
          </div>

          <div class="prompt-actions">
            <button class="ghost" id="reviewSkip" type="button">跳过</button>
            <button class="ghost" id="reviewCancel" type="button">稍后</button>
            <button class="apply" id="reviewSave" type="button">保存</button>
          </div>
        </div>
      </section>

      <section class="controls" id="controls">
        <div class="bar-row">
          <button class="mini-icon" id="barPlay" type="button" title="开始/暂停"><span id="barIcon"></span></button>
          <button class="mini-icon rest-task" id="restBtn" type="button" title="开始休息">休</button>
          <button class="mini-icon review-task" id="reviewBtn" type="button" title="补充工作评价">评</button>
          <span class="status" id="status">连续工作 · 第 1 个番茄</span>
          <span class="time-note" id="timeNote">B 休息 · V 评价 · X 停止</span>
          <details class="timer-more" id="timerMore"><summary data-icon="ellipsis" aria-label="更多操作" title="更多操作"></summary><div>
            <button class="mini-icon" id="skipButton" type="button" title="结束当前计时并进入下一个番茄"><span id="skipIcon"></span><span>结束本段</span></button>
            <button class="mini-icon stop-task" id="stopTaskBtn" type="button" title="彻底停止当前番茄钟 / 多轮循环"><span id="stopTaskIcon"></span><span>停止计时</span></button>
            <button class="mini-icon" id="leaveBtn" type="button" title="离开并停止当前番茄" data-icon="log-out">离开</button>
            <button class="mini-icon" id="volumeBtn" type="button" title="提示音音量"><span id="volumeIcon"></span><span>音量</span></button>
            <button class="mini-icon" id="settingsBtn" type="button" title="设置" data-icon="settings-2" aria-label="设置">设置</button>
          </div></details>
        </div>
        <div class="volume-pop" id="volumePop">
          <label>
            <span>提示音音量</span>
            <span id="volumeValue">75%</span>
          </label>
          <input class="volume-range" id="volumeRange" type="range" min="0" max="100" step="5" value="75" />
        </div>
      </section>

      <section class="settings" id="settingsPanel" aria-label="settings">
        <div class="settings-head">
          <h2 class="settings-title">设置</h2>
          <button class="close-btn" id="closeSettings" type="button">×</button>
        </div>

        <nav class="timer-settings-tabs" aria-label="设置分类"><button type="button" data-timer-tab="timing" aria-pressed="true">计时</button><button type="button" data-timer-tab="feedback" aria-pressed="false">声音与检测</button><button type="button" data-timer-tab="sites" aria-pressed="false">网站限制</button></nav>
        <div class="mode-buttons" id="modeButtons">
          <button class="mode-choice" data-mode="work" type="button">单独工作</button>
          <button class="mode-choice" data-mode="break" type="button">单独休息</button>
          <button class="mode-choice" data-mode="cycle" type="button">连续工作</button>
        </div>

        <div class="grid">
          <div class="field" data-timer-group="timing">
            <label for="singleWorkInput">单独工作 / 分钟</label>
            <input id="singleWorkInput" type="number" min="1" max="240" value="25" />
          </div>

          <div class="field" data-timer-group="timing">
            <label for="singleBreakInput">单独休息 / 分钟</label>
            <input id="singleBreakInput" type="number" min="1" max="240" value="5" />
          </div>

          <div class="field" data-timer-group="timing">
            <label for="cycleWorkInput">每个番茄 / 分钟</label>
            <input id="cycleWorkInput" type="number" min="1" max="240" value="25" />
          </div>

          <div class="field" data-timer-group="timing">
            <label for="cycleBreakInput">手动休息 / 分钟</label>
            <input id="cycleBreakInput" type="number" min="1" max="240" value="5" />
          </div>

          <div class="field" data-timer-group="feedback" hidden>
            <label for="volumeInput">提示音音量 / %</label>
            <input id="volumeInput" type="number" min="0" max="100" value="75" />
          </div>

          <div class="field" data-timer-group="feedback" hidden>
            <label for="presenceModeInput">在场检测</label>
            <select id="presenceModeInput">
              <option value="normal">普通 · 15分钟</option>
              <option value="reading">阅读 · 30分钟</option>
              <option value="strict">严格 · 8分钟</option>
              <option value="off">关闭自动检测</option>
            </select>
          </div>

          <div class="field wide" data-timer-group="sites" hidden>
            <label for="blacklistInput">工作阶段黑名单 / 每行一个域名</label>
            <textarea id="blacklistInput" placeholder="youtube.com&#10;bilibili.com&#10;twitter.com"></textarea>
          </div>

          <div class="field wide" data-timer-group="sites" hidden>
            <label for="whitelistInput">白名单例外 / 每行一个域名</label>
            <textarea id="whitelistInput" placeholder="docs.google.com&#10;github.com"></textarea>
          </div>
        </div>

        <div class="settings-actions">
          <button class="ghost" id="settingsTimelineBtn" type="button">打开时间轴</button>
          <button class="apply" id="applySettings" type="button">应用</button>
          <button class="ghost" id="resetTimer" type="button">重置计时</button>
          <button class="ghost" id="closeTimer" type="button">关闭小窗</button>
        </div>
      </section>
    </main>
  `;

  globalThis.PersonalSystemUI?.registerDocument(doc);
  const more = doc.getElementById("timerMore");
  doc.addEventListener("click", (event) => {
    if (!more.contains(event.target) || event.target.closest("button")) more.open = false;
    const tab = event.target.closest("[data-timer-tab]");
    if (!tab) return;
    for (const button of doc.querySelectorAll("[data-timer-tab]")) button.setAttribute("aria-pressed", String(button === tab));
    for (const field of doc.querySelectorAll("[data-timer-group]")) field.hidden = field.dataset.timerGroup !== tab.dataset.timerTab;
    doc.getElementById("modeButtons").hidden = tab.dataset.timerTab !== "timing";
  });
  doc.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && more.open) { event.preventDefault(); event.stopImmediatePropagation(); more.open = false; more.querySelector("summary").focus(); }
  }, true);
  for (const button of doc.querySelectorAll("button[title]")) {
    if (!button.hasAttribute("aria-label")) button.setAttribute("aria-label", button.title);
  }
  const $ = (id) => doc.getElementById(id);
  pip = {
    doc,
    surface: $("surface"),
    promptModal: $("promptModal"),
    promptTitle: $("promptTitle"),
    promptInput: $("promptInput"),
    promptNote: $("promptNote"),
    promptNoteButton: $("promptNoteButton"),
    promptOk: $("promptOk"),
    promptCancel: $("promptCancel"),
    workTitleDisplay: $("workTitleDisplay"),
    workTitleMeta: $("workTitleMeta"),
    timeWrap: doc.querySelector(".time-wrap"),
    timeDisplay: $("timeDisplay"),
    m1: $("m1"),
    m2: $("m2"),
    s1: $("s1"),
    s2: $("s2"),
    controls: $("controls"),
    centerPlay: $("centerPlay"),
    centerIcon: $("centerIcon"),
    barPlay: $("barPlay"),
    barIcon: $("barIcon"),
    skipButton: $("skipButton"),
    skipIcon: $("skipIcon"),
    stopTaskBtn: $("stopTaskBtn"),
    stopTaskIcon: $("stopTaskIcon"),
    restBtn: $("restBtn"),
    reviewBtn: $("reviewBtn"),
    presenceModal: $("presenceModal"),
    presenceMessage: $("presenceMessage"),
    presenceHere: $("presenceHere"),
    presenceAway: $("presenceAway"),
    reviewModal: $("reviewModal"),
    reviewScroll: $("reviewScroll"),
    reviewRecordMeta: $("reviewRecordMeta"),
    reviewNote: $("reviewNote"),
    reviewSave: $("reviewSave"),
    reviewCancel: $("reviewCancel"),
    reviewSkip: $("reviewSkip"),
    leaveBtn: $("leaveBtn"),
    volumeBtn: $("volumeBtn"),
    volumeIcon: $("volumeIcon"),
    volumePop: $("volumePop"),
    volumeRange: $("volumeRange"),
    volumeValue: $("volumeValue"),
    status: $("status"),
    settingsBtn: $("settingsBtn"),
    closeSettings: $("closeSettings"),
    modeButtons: [...doc.querySelectorAll(".mode-choice")],
    singleWorkInput: $("singleWorkInput"),
    singleBreakInput: $("singleBreakInput"),
    cycleWorkInput: $("cycleWorkInput"),
    cycleBreakInput: $("cycleBreakInput"),
    volumeInput: $("volumeInput"),
    presenceModeInput: $("presenceModeInput"),
    blacklistInput: $("blacklistInput"),
    whitelistInput: $("whitelistInput"),
    applySettings: $("applySettings"),
    resetTimer: $("resetTimer"),
    closeTimer: $("closeTimer"),
    pinWindowButton: $("pinWindowButton"),
    fullWorkspaceButton: $("fullWorkspaceButton"),
    mainPageStatus: $("mainPageStatus"),
  };

  bindPipEvents();
  refreshPendingReviewCount();
}

function isEditableTarget(target) {
  if (!target) return false;
  const tag = target.tagName;
  return tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    target.isContentEditable;
}

function bindPipEvents() {
  pip.fullWorkspaceButton?.addEventListener("click", (event) => {
    event.stopPropagation();
    openTimelinePage();
  });
  pip.pinWindowButton?.addEventListener("click", (event) => {
    event.stopPropagation();
    openPip();
  });
  pip.centerPlay.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleRun();
  });

  pip.barPlay.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleRun();
  });

  pip.promptOk.addEventListener("click", (event) => {
    event.stopPropagation();
    if (pendingPromptResolve) {
      pendingPromptResolve(pip.promptInput.value, pip.promptNote.value);
    }
  });

  pip.promptCancel.addEventListener("click", (event) => {
    event.stopPropagation();
    if (pendingPromptResolve) {
      pendingPromptResolve(pip.promptInput.defaultValue || pip.promptInput.value, pip.promptNote.value);
    }
  });

  pip.promptNoteButton.addEventListener("click", (event) => {
    event.stopPropagation();
    promptNoteVisible = !promptNoteVisible;
    pip.surface.classList.toggle("prompt-note-open", promptNoteVisible);
    if (promptNoteVisible) {
      setTimeout(() => pip.promptNote.focus(), 0);
    }
  });


  pip.promptInput.addEventListener("keydown", (event) => {
    event.stopPropagation();
    if (event.key === "Enter" && pendingPromptResolve) {
      pendingPromptResolve(pip.promptInput.value, pip.promptNote.value);
    }
    if (event.key === "Escape" && pendingPromptResolve) {
      pendingPromptResolve(pip.promptInput.defaultValue || pip.promptInput.value, pip.promptNote.value);
    }
  });

  pip.doc.querySelectorAll("input, textarea, select").forEach((field) => {
    field.addEventListener("click", (event) => event.stopPropagation());
    field.addEventListener("mousedown", (event) => event.stopPropagation());
    field.addEventListener("keydown", (event) => event.stopPropagation());
  });

  pip.skipButton.addEventListener("click", (event) => {
    event.stopPropagation();
    skipCurrentPhase();
  });

  if (pip.stopTaskBtn) {
    pip.stopTaskBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      stopCurrentPomodoroTask();
    });
  }

  pip.restBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleManualBreak();
  });

  pip.presenceHere.addEventListener("click", (event) => {
    event.stopPropagation();
    confirmPresenceHere("button");
  });

  pip.presenceAway.addEventListener("click", (event) => {
    event.stopPropagation();
    confirmPresenceAway();
  });

  pip.presenceModal.addEventListener("click", (event) => {
    event.stopPropagation();
  });

  pip.reviewBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    openReviewPanel();
  });

  pip.reviewModal.addEventListener("click", (event) => {
    event.stopPropagation();
  });

  pip.reviewSave.addEventListener("click", (event) => {
    event.stopPropagation();
    saveReviewPanel(false);
  });

  pip.reviewSkip.addEventListener("click", (event) => {
    event.stopPropagation();
    saveReviewPanel(true);
  });

  pip.reviewCancel.addEventListener("click", (event) => {
    event.stopPropagation();
    postponeReviewPrompt();
  });

  pip.leaveBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleLeaveState();
  });

  pip.volumeBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    volumePanelVisible = !volumePanelVisible;
    showControls();
    render();
  });

  pip.volumeRange.addEventListener("input", () => {
    settings.volume = readInt(pip.volumeRange.value, 75, 0, 100);
    if (pip.volumeInput) {
      pip.volumeInput.value = settings.volume;
    }
    render();
    showControls();
  });

  pip.settingsBtn.addEventListener("click", () => {
    volumePanelVisible = false;
    settingsVisible = true;
    syncSettingsForm();
    render();
    showControls();
  });

  pip.closeSettings.addEventListener("click", () => {
    settingsVisible = false;
    render();
    showControls();
  });

  pip.modeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      settings.mode = button.dataset.mode;
      renderModeButtons();
    });
  });

  pip.applySettings.addEventListener("click", () => {
    const previousSettings = { ...settings };
    applySettingsFromForm();
    applyHotSettings(previousSettings);
    savePersistentSettings();
    configurePresenceDetection();
    updateWebsiteBlocking();
    volumePanelVisible = false;
    settingsVisible = false;
    render();
    showControls();
  });

  pip.resetTimer.addEventListener("click", resetTimer);
  pip.closeTimer.addEventListener("click", () => {
    closePip();
  });

  pip.surface.addEventListener("mousemove", showControls);
  pip.surface.addEventListener("mouseenter", showControls);
  pip.surface.addEventListener("mouseleave", scheduleHideControls);
  pip.surface.addEventListener("click", (event) => {
    if (isEditableTarget(event.target)) {
      return;
    }
    pip.surface.focus();
  });

  pip.doc.addEventListener("keydown", (event) => {
    if (isEditableTarget(event.target)) {
      return;
    }

    if (event.code === "Space") {
      event.preventDefault();
      toggleRun();
      showControls();
      return;
    }

    if (event.key.toLowerCase() === "r") {
      event.preventDefault();
      resetTimer();
      return;
    }

    if (event.key.toLowerCase() === "x") {
      event.preventDefault();
      stopCurrentPomodoroTask();
      return;
    }

    if (event.key.toLowerCase() === "v") {
      event.preventDefault();
      openReviewPanel();
      return;
    }

    if (event.key.toLowerCase() === "b") {
      event.preventDefault();
      toggleManualBreak();
      return;
    }

    if (event.key.toLowerCase() === "l") {
      event.preventDefault();
      toggleLeaveState();
      return;
    }

    if (event.key.toLowerCase() === "t") {
      event.preventDefault();
      openTimelinePage();
      return;
    }

    if (event.key.toLowerCase() === "n") {
      event.preventDefault();
      skipCurrentPhase();
      return;
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      seekBy(event.shiftKey ? -LARGE_SEEK : -SMALL_SEEK);
      return;
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      seekBy(event.shiftKey ? LARGE_SEEK : SMALL_SEEK);
    }
  });

  setupAdaptiveTimeLayout();
  syncSettingsForm();
  pip.surface.focus();
}

function setupAdaptiveTimeLayout() {
  if (!pip || !pip.timeWrap || !pip.timeDisplay || !pipWindow) return;

  cleanupAdaptiveLayout();

  const ResizeObserverCtor = pipWindow.ResizeObserver || ResizeObserver;
  adaptiveResizeObserver = new ResizeObserverCtor(() => {
    requestAdaptiveTimeLayout();
  });

  adaptiveResizeObserver.observe(pip.surface);
  adaptiveResizeObserver.observe(pip.timeWrap);
  pipWindow.addEventListener("resize", requestAdaptiveTimeLayout);

  requestAdaptiveTimeLayout();
}

function cleanupAdaptiveLayout() {
  if (adaptiveResizeObserver) {
    adaptiveResizeObserver.disconnect();
    adaptiveResizeObserver = null;
  }

  if (adaptiveRafId) {
    const cancel = pipWindow?.cancelAnimationFrame || cancelAnimationFrame;
    cancel.call(pipWindow || window, adaptiveRafId);
    adaptiveRafId = null;
  }
}

function requestAdaptiveTimeLayout() {
  if (!pip || !pip.timeWrap || !pip.timeDisplay || !pipWindow || pipWindow.closed) return;

  if (adaptiveRafId) {
    const cancel = pipWindow.cancelAnimationFrame || cancelAnimationFrame;
    cancel.call(pipWindow, adaptiveRafId);
  }

  const raf = pipWindow.requestAnimationFrame || requestAnimationFrame;
  adaptiveRafId = raf.call(pipWindow, () => {
    adaptiveRafId = null;
    adaptTimeLayout();
  });
}

function adaptTimeLayout() {
  if (!pip || !pip.timeWrap || !pip.timeDisplay || !pipWindow || pipWindow.closed) return;

  const viewportWidth = Math.max(120, pipWindow.innerWidth || pip.surface.clientWidth || 120);
  const viewportHeight = Math.max(90, pipWindow.innerHeight || pip.surface.clientHeight || 90);

  pip.surface.classList.toggle("narrow", viewportWidth < 500);
  pip.surface.classList.toggle("very-narrow", viewportWidth < 410);
  pip.surface.classList.toggle("short", viewportHeight < 260);
  pip.surface.classList.toggle("tiny-height", viewportHeight < 210);

  const titleRect = pip.workTitleDisplay?.getBoundingClientRect?.();
  const controlsRect = pip.controls?.getBoundingClientRect?.();
  const titleReserve = viewportHeight < 210 ? 32 : Math.ceil((titleRect?.height || 34) + (viewportHeight < 260 ? 10 : 20));
  const controlsReserve = Math.ceil((controlsRect?.height || 42) + (viewportHeight < 260 ? 10 : 18));
  const maxWidth = Math.max(90, pip.timeWrap.clientWidth - 32);
  const maxHeight = Math.max(38, Math.min(pip.timeWrap.clientHeight - 12, viewportHeight - titleReserve - controlsReserve));

  let low = 22;
  let high = 132;
  let best = low;

  pip.timeDisplay.style.transform = "translateZ(0) scale(1)";

  for (let i = 0; i < 14; i += 1) {
    const mid = (low + high) / 2;
    pip.timeDisplay.style.fontSize = `${mid}px`;

    const rect = pip.timeDisplay.getBoundingClientRect();
    const fits = rect.width <= maxWidth && rect.height <= maxHeight;

    if (fits) {
      best = mid;
      low = mid;
    } else {
      high = mid;
    }
  }

  pip.timeDisplay.style.fontSize = `${Math.floor(best)}px`;

  const finalRect = pip.timeDisplay.getBoundingClientRect();
  const scale = Math.min(
    1,
    maxWidth / Math.max(finalRect.width, 1),
    maxHeight / Math.max(finalRect.height, 1)
  );

  pip.timeDisplay.style.transform = `translateZ(0) scale(${scale})`;
}


function isTimerFreshAndIdle() {
  return !running &&
    !activeTimelineRecordId &&
    !timer.finished &&
    timer.remaining === timer.total;
}

function shouldKeepCurrentTimerOnApply(previousSettings) {
  if (running || activeTimelineRecordId) return true;
  if (timer.finished) return true;
  if (timer.remaining !== timer.total) return true;

  // Fresh idle timer can safely follow new settings because no Pomodoro has started.
  return false;
}

function applyHotSettings(previousSettings) {
  const keepCurrentTimer = shouldKeepCurrentTimerOnApply(previousSettings);

  if (!keepCurrentTimer) {
    timer = createTimerFromSettings();
    return;
  }

  // Preserve current countdown state. Only future phases use new settings.
  // For an untouched single-mode timer that was already created before the user changed settings,
  // this intentionally avoids silently moving the current time.
  if (timer.sourceMode === "cycle") {
  }
}

function syncSettingsForm() {
  if (!pip) return;
  pip.singleWorkInput.value = settings.singleWorkMinutes;
  pip.singleBreakInput.value = settings.singleBreakMinutes;
  pip.cycleWorkInput.value = settings.cycleWorkMinutes;
  pip.cycleBreakInput.value = settings.cycleBreakMinutes;
  pip.volumeInput.value = settings.volume;
  pip.presenceModeInput.value = settings.presenceMode || "normal";
  pip.blacklistInput.value = settings.blacklist;
  pip.whitelistInput.value = settings.whitelist;
  if (pip.volumeRange) {
    pip.volumeRange.value = settings.volume;
  }
  renderModeButtons();
}

function renderModeButtons() {
  if (!pip) return;
  pip.modeButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.mode === settings.mode);
  });
}

function applySettingsFromForm() {
  settings = {
    mode: settings.mode,
    singleWorkMinutes: readInt(pip.singleWorkInput.value, 25, 1, 240),
    singleBreakMinutes: readInt(pip.singleBreakInput.value, 5, 1, 240),
    cycleWorkMinutes: readInt(pip.cycleWorkInput.value, 25, 1, 240),
    cycleBreakMinutes: readInt(pip.cycleBreakInput.value, 5, 1, 240),
    volume: readInt(pip.volumeInput.value, 75, 0, 100),
    presenceMode: pip.presenceModeInput.value || "normal",
    blacklist: pip.blacklistInput.value.trim(),
    whitelist: pip.whitelistInput.value.trim(),
  };
  syncSettingsForm();
}

function createTimerFromSettings() {
  if (settings.mode === "break") {
    const total = settings.singleBreakMinutes * 60;
    return {
      sourceMode: "break",
      phase: "break",
      round: 1,
      total,
      remaining: total,
      finished: false,
    };
  }

  const total = settings.mode === "work"
    ? settings.singleWorkMinutes * 60
    : settings.cycleWorkMinutes * 60;

  return {
    sourceMode: settings.mode === "work" ? "work" : "cycle",
    phase: "work",
    round: 1,
    total,
    remaining: total,
    finished: false,
  };
}

function toggleRun() {
  running ? pause() : start();
}

async function start() {
  if (leaveState) {
    await resolveLeaveAndResume();
    return;
  }

  if (timer.finished || timer.remaining <= 0) {
    timer = createTimerFromSettings();
  }

  const isFreshPhase = timer.remaining === timer.total;
  running = true;
  stopTick();

  if (isFreshPhase && timer.phase === "work") {
    await beginWorkRecord();
  }

  if (isFreshPhase && timer.phase === "break") {
    await startTimelineRecord("break", "休息");
  }

  if (isFreshPhase) {
    playPhaseStartTone(timer.phase);
  }

  // startTimelineRecord writes asynchronously. A quick second click may pause
  // while that write is pending; do not resurrect the ticking interval after
  // the user has already paused.
  if (!running) {
    render();
    return;
  }

  tickId = setInterval(async () => {
    timer.remaining = Math.max(0, timer.remaining - 1);

    if (timer.remaining <= 0) {
      await advanceOrFinish();
    }

    render();
  }, 1000);

  render();
  scheduleHideControls();
}

function pause() {
  running = false;
  stopTick();
  render();
}

function stopTick() {
  if (tickId) {
    clearInterval(tickId);
    tickId = null;
  }
}

async function stopAll() {
  clearPresenceConfirmation();
  clearLeaveThresholdTimer();

  if (leaveState && activeTimelineRecordId) {
    const state = leaveState;
    await finishActiveTimelineRecord(currentPhaseTimelineContent(), state.startedAt, {
      completedNaturally: false,
      completionReason: "closed_during_leave",
    });

    if (Date.now() - state.startedAt > SHORT_LEAVE_THRESHOLD_MS) {
      const interval = boundedLongLeaveInterval(state.startedAt, Date.now());
      if (interval.end - interval.start >= 60 * 1000) {
        await addTimelineIntervalRecord(
          "life",
          "离开后关闭番茄钟",
          interval.start,
          interval.end,
          { boundedLeave: true }
        );
      }
    }
  } else if (running || activeTimelineRecordId) {
    await finishActiveTimelineRecord(undefined, Date.now(), {
      completedNaturally: false,
      completionReason: "controller_closed",
    });
  }

  leaveState = null;
  running = false;
  stopTick();
  updateWebsiteBlocking();
  await persistControllerHeartbeat();
}


async function stopCurrentPomodoroTask() {
  if (phaseTransitionPromise) await phaseTransitionPromise;
  clearPresenceConfirmation();
  clearLeaveThresholdTimer();
  if (timer.finished && !running && !activeTimelineRecordId) {
    return;
  }

  const ok = pipWindow && !pipWindow.closed
    ? pipWindow.confirm("确认彻底停止当前番茄钟吗？\n再次开始时将从头重新计时。")
    : confirm("确认彻底停止当前番茄钟吗？");

  if (!ok) return;

  if (pendingPromptResolve) {
    pendingPromptResolve(currentWorkPlan || "工作", "");
  }

  if (activeTimelineRecordId) {
    await finishActiveTimelineRecord(currentPhaseTimelineContent(), Date.now(), {
      completedNaturally: false,
      completionReason: "stopped",
    });
  }

  leaveState = null;

  running = false;
  stopTick();
  timer.finished = true;
  timer.remaining = 0;
  updateWebsiteBlocking();

  if (pip?.status) {
    pip.status.textContent = "已终止";
  }

  render();
  showControls();
  await promptPendingReviewIfUseful("当前番茄钟任务已手动终止");
  await clearSelectedNotionTodo();
  render();
}

async function resetTimer() {
  if (phaseTransitionPromise) await phaseTransitionPromise;
  clearPresenceConfirmation();
  clearLeaveThresholdTimer();
  leaveState = null;
  if (running || activeTimelineRecordId) {
    await finishActiveTimelineRecord(undefined, Date.now(), {
      completedNaturally: false,
      completionReason: "reset",
    });
  }
  running = false;
  stopTick();
  activeTimelineRecordId = null;
  timer = createTimerFromSettings();
  render();
  showControls();
}


async function skipCurrentPhase() {
  if (timer.finished) {
    return;
  }

  if (timer.phase === "work") {
    // In continuous-work mode, skip means finish the current work block and start the next work block directly.
    await advanceOrFinish("skipped");
  } else if (timer.phase === "break") {
    await finishBreakAndStartWork();
  }

  render();
  showControls();
}

async function advanceOrFinish(completionReason = "completed") {
  if (phaseTransitionPromise) return phaseTransitionPromise;
  phaseTransitionPromise = performAdvanceOrFinish(completionReason)
    .finally(() => { phaseTransitionPromise = null; });
  return phaseTransitionPromise;
}

async function performAdvanceOrFinish(completionReason = "completed") {
  const sourceMode = timer.sourceMode || settings.mode;

  if (timer.phase === "work") {
    const completedNaturally = completionReason === "completed";
    const transition = await finishCurrentWorkRecordForTransition({
      completedNaturally,
      completionReason,
    });
    if (!transition.hadActiveRecord) {
      return;
    }

    playPhaseEndTone("work");
    await triggerReviewPrompt(
      completedNaturally ? "番茄钟已完成" : "已跳过当前工作段"
    );

    if (sourceMode === "work") {
      running = false;
      timer.remaining = 0;
      timer.finished = true;
      stopTick();
      updateWebsiteBlocking();
      return;
    }

    timer.round += 1;
    timer.phase = "work";
    timer.total = settings.cycleWorkMinutes * 60;
    timer.remaining = timer.total;
    timer.finished = false;
    await beginWorkRecord();
    playPhaseStartTone("work");
    return;
  }

  if (timer.phase === "break") {
    if (sourceMode === "break") {
      await finishActiveTimelineRecord();
      playPhaseEndTone("break");
      running = false;
      timer.finished = true;
      stopTick();
      playAllDoneTone();
      return;
    }

    await finishBreakAndStartWork();
  }
}

function seekBy(deltaElapsed) {
  const elapsed = timer.total - timer.remaining;
  const nextElapsed = clamp(elapsed + deltaElapsed, 0, timer.total);
  timer.remaining = timer.total - nextElapsed;
  timer.finished = false;
  render();
  showControls();
}

function render() {
  if (!pip) return;

  const m = Math.floor(timer.remaining / 60);
  const s = timer.remaining % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  const elapsed = timer.total - timer.remaining;
  const pct = timer.total ? (elapsed / timer.total) * 100 : 0;

  pip.m1.textContent = mm[0];
  pip.m2.textContent = mm[1];
  pip.s1.textContent = ss[0];
  pip.s2.textContent = ss[1];

  if (pip.workTitleDisplay) {
    const nextTitle = timer.phase === "break" ? `休息中 · ${currentWorkPlan || "工作"}` : (currentWorkPlan || "工作");
    if (pip.workTitleDisplay.textContent !== nextTitle) pip.workTitleDisplay.textContent = nextTitle;
    if (pip.workTitleMeta) {
      const meta = activeTodoContext ? "来自每日待办" : "未选择待办 · 默认记录为“工作”";
      if (pip.workTitleMeta.textContent !== meta) pip.workTitleMeta.textContent = meta;
    }
  }

  pip.centerIcon.innerHTML = playSvg();
  pip.barIcon.innerHTML = running ? pauseSvg() : playSvg();
  pip.skipIcon.innerHTML = skipSvg();
  if (pip.stopTaskIcon) pip.stopTaskIcon.innerHTML = stopSquareSvg();
  pip.skipButton.disabled = timer.finished;
  if (pip.stopTaskBtn) {
    pip.stopTaskBtn.disabled = timer.finished && !running && !activeTimelineRecordId;
  }
  pip.restBtn.innerHTML = globalThis.PersonalSystemUI?.icon(timer.phase === "break" ? "briefcase-business" : "coffee")?.outerHTML || "";
  if (pip.reviewBtn) {
    pip.reviewBtn.classList.toggle("has-pending", pendingReviewCount > 0);
    pip.reviewBtn.innerHTML = globalThis.PersonalSystemUI?.icon("square-pen")?.outerHTML || "";
    pip.reviewBtn.title = pendingReviewCount > 0 ? `补充完成情况（${pendingReviewCount} 条待填写）` : "补充完成情况";
    pip.reviewBtn.setAttribute("aria-label", pip.reviewBtn.title);
  }
  pip.restBtn.title = timer.phase === "break" ? "结束休息并开始工作" : "开始休息";
  pip.restBtn.disabled = timer.finished;
  pip.leaveBtn.innerHTML = (globalThis.PersonalSystemUI?.icon("log-out")?.outerHTML || "") + "<span>离开</span>";
  pip.leaveBtn.classList.toggle("leave-active", Boolean(leaveState));
  pip.leaveBtn.disabled = !running || timer.finished || Boolean(leaveState);
  pip.volumeIcon.innerHTML = volumeSvg(settings.volume);
  pip.volumeValue.textContent = `${settings.volume}%`;
  pip.volumeRange.value = String(settings.volume);
  pip.volumeRange.style.setProperty("--volume-percent", `${settings.volume}%`);
  pip.volumePop.classList.toggle("visible", volumePanelVisible);

  pip.status.textContent = getStatusText();

  pip.surface.classList.toggle("running", running);
  pip.surface.classList.toggle("paused", !running);
  pip.surface.classList.toggle("settings-open", settingsVisible);
  pip.surface.classList.toggle("presence-open", Boolean(presencePromptOpen));
  pip.surface.classList.toggle("break-mode", timer.phase === "break");
  renderModeButtons();
  updateWebsiteBlocking();

  requestAdaptiveTimeLayout();

  if (pipWindow && !pipWindow.closed) {
    pipWindow.document.title = `个人系统 · ${mm}:${ss}`;
  }
}


function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getStatusText() {
  if (presencePromptOpen) return "等待在场确认";
  if (leaveState) {
    const minutes = Math.floor((Date.now() - leaveState.startedAt) / 60000);
    return leaveState.isLong
      ? `长时间离开 · ${minutes}分钟`
      : `短暂离开 · ${minutes}分钟`;
  }
  if (timer.finished) return "已完成";
  const sourceMode = timer.sourceMode || settings.mode;

  if (sourceMode === "break") {
    return "休息";
  }

  if (timer.phase === "break") {
    return `手动休息 · 已完成 ${Math.max(0, timer.round - 1)} 个番茄`;
  }

  if (sourceMode === "work") return "单独工作";
  return `连续工作 · 第 ${timer.round} 个番茄`;
}

function showControls() {
  if (!pip) return;
  pip.surface.classList.add("controls-visible");
  if (controlsHideId) clearTimeout(controlsHideId);

  if (running && !settingsVisible && !volumePanelVisible) {
    controlsHideId = setTimeout(() => {
      pip.surface.classList.remove("controls-visible");
    }, CONTROLS_HIDE_MS);
  }
}

function scheduleHideControls() {
  if (!pip) return;
  if (controlsHideId) clearTimeout(controlsHideId);

  if (running && !settingsVisible && !volumePanelVisible) {
    controlsHideId = setTimeout(() => {
      pip.surface.classList.remove("controls-visible");
    }, 450);
  }
}

async function closePip() {
  if (pendingPromptResolve) {
    pendingPromptResolve("工作", "");
  }

  intentionalPipClose = true;

  if (pipWindow && !pipWindow.closed) {
    if (mainPageMode && pipWindow === window) {
      await stopAll();
      timer = createTimerFromSettings();
      setControlStatus("当前番茄钟已停止并重置。");
      render();
      return;
    }
    pipWindow.close();
    return;
  }

  await stopAll();
  cleanupAdaptiveLayout();
  pipWindow = null;
  pip = null;
  timer = createTimerFromSettings();
  setControlStatus("番茄钟小窗已关闭，当前计时已全部停止。");
}

function playSvg() {
  return globalThis.PersonalSystemUI?.icon("play")?.outerHTML || "";
}

function pauseSvg() {
  return globalThis.PersonalSystemUI?.icon("pause")?.outerHTML || "";
}

function skipSvg() {
  return globalThis.PersonalSystemUI?.icon("skip-forward")?.outerHTML || "";
}

function stopSquareSvg() {
  return globalThis.PersonalSystemUI?.icon("square")?.outerHTML || "";
}

function volumeSvg(volume) {
  return globalThis.PersonalSystemUI?.icon(volume <= 0 ? "volume-x" : volume < 45 ? "volume-1" : "volume-2")?.outerHTML || "";
}

function getAudioContext() {
  audioContext = audioContext || new AudioContext();
  if (audioContext.state === "suspended") {
    audioContext.resume();
  }
  return audioContext;
}

function playPhaseStartTone(phase) {
  if (phase === "work") {
    playToneSequence([
      { frequency: 740.00, offset: 0.00, duration: 0.11, gain: 0.26, type: "square" },
      { frequency: 988.00, offset: 0.13, duration: 0.16, gain: 0.30, type: "triangle" },
    ]);
    return;
  }

  playToneSequence([
    { frequency: 523.25, offset: 0.00, duration: 0.12, gain: 0.22, type: "triangle" },
    { frequency: 659.25, offset: 0.14, duration: 0.18, gain: 0.25, type: "sine" },
  ]);
}

function playPhaseEndTone(phase) {
  if (phase === "work") {
    playToneSequence([
      { frequency: 880.00, offset: 0.00, duration: 0.10, gain: 0.30, type: "square" },
      { frequency: 1174.66, offset: 0.12, duration: 0.10, gain: 0.30, type: "square" },
      { frequency: 1567.98, offset: 0.24, duration: 0.22, gain: 0.34, type: "triangle" },
    ]);
    return;
  }

  playToneSequence([
    { frequency: 784.00, offset: 0.00, duration: 0.10, gain: 0.28, type: "triangle" },
    { frequency: 587.33, offset: 0.12, duration: 0.10, gain: 0.28, type: "triangle" },
    { frequency: 392.00, offset: 0.24, duration: 0.22, gain: 0.30, type: "sine" },
  ]);
}

function playAllDoneTone() {
  playToneSequence([
    { frequency: 659.25, offset: 0.46, duration: 0.10, gain: 0.26, type: "triangle" },
    { frequency: 880.00, offset: 0.58, duration: 0.10, gain: 0.28, type: "triangle" },
    { frequency: 1174.66, offset: 0.70, duration: 0.12, gain: 0.30, type: "square" },
    { frequency: 1567.98, offset: 0.86, duration: 0.30, gain: 0.34, type: "triangle" },
  ]);
}

function playToneSequence(notes) {
  if (settings.volume <= 0) return;

  try {
    const ctx = getAudioContext();
    const volumeScale = Math.max(0, Math.min(1, settings.volume / 100));

    notes.forEach(({ frequency, offset, duration, gain, type }) => {
      const start = ctx.currentTime + offset;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      oscillator.type = type || "sine";
      oscillator.frequency.setValueAtTime(frequency, start);

      filter.type = "lowpass";
      filter.frequency.setValueAtTime(2600, start);
      filter.Q.setValueAtTime(0.7, start);

      const finalGain = Math.min(0.42, gain * volumeScale);
      gainNode.gain.setValueAtTime(0.0001, start);
      gainNode.gain.exponentialRampToValueAtTime(Math.max(0.0001, finalGain), start + 0.012);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, start + duration);

      oscillator.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(ctx.destination);
      oscillator.start(start);
      oscillator.stop(start + duration + 0.03);
    });
  } catch {}
}

function readInt(value, fallbackValue, min, max) {
  const n = Number.parseInt(value, 10);
  if (!Number.isFinite(n)) return fallbackValue;
  return clamp(n, min, max);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

const settingsTimelineBtn = document.getElementById("settingsTimelineBtn");
if (settingsTimelineBtn) {
  settingsTimelineBtn.addEventListener("click", () => {
    window.open(chrome.runtime.getURL("timeline.html"), "_blank");
  });
}

document.getElementById("openTimelineBtn")?.addEventListener("click", () => {
  window.open(chrome.runtime.getURL("timeline.html"), "_blank");
});

async function initDefaultBlacklist() {
  const result = await chrome.storage.local.get(["blacklist"]);
  if (!Array.isArray(result.blacklist) || result.blacklist.length === 0) {
    await chrome.storage.local.set({
      blacklist: [
        "youtube.com",
        "bilibili.com",
        "douyin.com",
        "tiktok.com",
        "twitter.com",
        "x.com",
        "reddit.com"
      ]
    });
  }
}
initDefaultBlacklist();
