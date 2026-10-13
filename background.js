importScripts("llm-prompt-registry.js", "llm-prompt-examples.js", "llm-prompt-contracts.js", "llm-prompts.js", "notion-client.js");
const notionIntegration = globalThis.MinimalPomodoroNotion;

let controllerTabId = null;
let timelineTabId = null;
let quickWindowId = null;
let activeRuleIds = [];
let phaseSummaryPromise = null;
let initialDayTodoPromise = null;

chrome.runtime.onInstalled.addListener(async () => {
  await clearBlockingRules();
  await scheduleNotionAutomation();
  chrome.alarms.create("notionInitialDayTodosSoon", { delayInMinutes: 0.1 });
});

chrome.runtime.onStartup.addListener(async () => {
  await finalizeStaleControllerRecord();
  await clearBlockingRules();
  await scheduleNotionAutomation();
  chrome.alarms.create("notionInitialDayTodosSoon", { delayInMinutes: 0.1 });
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === "notionAutoSync") {
    await runNotionAutoSync();
    return;
  }

  if (alarm.name === "notionPeriodicSync") {
    await runNotionPeriodicSync();
    return;
  }

  if (alarm.name === "notionDailyReview") {
    await runNotionDailyReview(alarm.scheduledTime);
    await scheduleDailyReviewAlarm(await notionIntegration.getConfig());
    return;
  }

  if (alarm.name === "notionInitialDayTodos" || alarm.name === "notionInitialDayTodosSoon") {
    try {
      await ensureTodayInitialTodos();
    } catch (error) {
      console.warn("Unable to generate initial-day todos", error);
    } finally {
      if (alarm.name === "notionInitialDayTodos") await scheduleDailyAlarm("notionInitialDayTodos", 0, 5);
    }
    return;
  }

  if (alarm.name === "notionIntradayAdjust13" || alarm.name === "notionIntradayAdjust18") {
    const hour = alarm.name.endsWith("13") ? 13 : 18;
    await runNotionIntradayAdjustment(hour, alarm.scheduledTime);
    await scheduleDailyAlarm(alarm.name, hour, 0);
    return;
  }

  if (alarm.name === "pomodoroReviewReminder") {
    await showReviewNotification();
    chrome.alarms.create("pomodoroReviewReminder", { delayInMinutes: 5 });
    return;
  }

  if (!alarm.name.startsWith("tempAccess:")) return;
  const id = Number(alarm.name.split(":")[1]);
  if (Number.isFinite(id)) {
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: [id],
    });
  }
});

chrome.action.onClicked.addListener(async () => {
  if (quickWindowId === null) {
    const existing = await chrome.tabs.query({
      url: chrome.runtime.getURL("timeline.html?mode=today&compact=1"),
    });
    quickWindowId = existing[0]?.windowId ?? null;
    if (existing[0]?.id) {
      timelineTabId = existing[0].id;
      controllerTabId = existing[0].id;
    }
  }
  if (quickWindowId !== null) {
    try {
      await chrome.windows.update(quickWindowId, { focused: true });
      return;
    } catch {
      quickWindowId = null;
    }
  }

  const quickWindow = await chrome.windows.create({
    url: chrome.runtime.getURL("timeline.html?mode=today&compact=1"),
    type: "popup",
    width: 1280,
    height: 900,
    focused: true,
  });
  const tab = quickWindow.tabs && quickWindow.tabs[0];
  quickWindowId = quickWindow.id ?? null;
  timelineTabId = tab?.id ?? null;
  controllerTabId = tab?.id ?? null;
});

chrome.windows.onRemoved.addListener((windowId) => {
  if (windowId === quickWindowId) quickWindowId = null;
});

chrome.tabs.onRemoved.addListener(async (tabId) => {
  if (tabId === timelineTabId) timelineTabId = null;
  if (tabId === controllerTabId) {
    controllerTabId = null;
    await finalizeStaleControllerRecord();
    await clearBlockingRules();
  }
});

async function finalizeStaleControllerRecord() {
  const heartbeatKey = "minimalPomodoroControllerHeartbeat";
  const storage = await chrome.storage.local.get(null);
  const heartbeat = storage[heartbeatKey];
  const recordId = String(heartbeat?.activeTimelineRecordId || "");
  if (!recordId) return false;
  const heartbeatAt = Number(heartbeat?.at) || Date.now();
  const safeEnd = Math.min(Date.now(), heartbeatAt + 15000);
  for (const [key, value] of Object.entries(storage)) {
    if (!key.startsWith("minimalPomodoroTimeline:") || !Array.isArray(value)) continue;
    const index = value.findIndex((record) => record?.id === recordId && record.end == null);
    if (index < 0) continue;
    const next = [...value];
    const record = { ...next[index] };
    record.end = Math.max(Number(record.start) || safeEnd, safeEnd);
    if (record.type === "work") {
      record.reviewPending = true;
      record.completedNaturally = false;
      record.completionReason = "controller_closed";
    }
    if (record.end - Number(record.start) < 60000) next.splice(index, 1);
    else next[index] = record;
    await chrome.storage.local.set({
      [key]: next,
      [heartbeatKey]: { at: Date.now(), running: false, activeTimelineRecordId: "" },
    });
    return true;
  }
  await chrome.storage.local.set({
    [heartbeatKey]: { at: Date.now(), running: false, activeTimelineRecordId: "" },
  });
  return false;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || !message.type) {
    return false;
  }

  if (message.type === "UPDATE_BLOCKING_RULES") {
    updateBlockingRules(message.payload)
      .then(() => sendResponse({ ok: true }))
      .catch((error) => sendResponse({ ok: false, error: String(error) }));
    return true;
  }

  if (message.type === "GRANT_TEMP_ACCESS") {
    grantTemporaryAccess(message.payload)
      .then((payload) => sendResponse({ ok: true, payload }))
      .catch((error) => sendResponse({ ok: false, error: String(error) }));
    return true;
  }

  if (message.type === "SCHEDULE_REVIEW_REMINDER") {
    const delayMinutes = Math.max(1, Number(message.payload?.delayMinutes || 5));
    if (message.payload?.immediate) {
      showReviewNotification();
    }
    chrome.alarms.create("pomodoroReviewReminder", {
      delayInMinutes: delayMinutes,
    });
    sendResponse({ ok: true });
    return false;
  }

  if (message.type === "CANCEL_REVIEW_REMINDER") {
    chrome.alarms.clear("pomodoroReviewReminder");
    chrome.notifications.clear("pomodoroReview");
    sendResponse({ ok: true });
    return false;
  }

  if (message.type === "NOTION_CONFIG_UPDATED") {
    scheduleNotionAutomation()
      .then(() => sendResponse({ ok: true }))
      .catch((error) => sendResponse({ ok: false, error: String(error) }));
    return true;
  }

  if (message.type === "START_NOTION_TODO") {
    prepareControllerForTodo(message.payload)
      .then((result) => sendResponse({ ok: true, ...result }))
      .catch((error) => sendResponse({ ok: false, started: false, error: String(error) }));
    return true;
  }

  if (message.type === "NOTION_TODO_STARTED") {
    const todo = message.payload;
    notionIntegration.queueDailyTodoUpsert(todo?.date || localDateKey(new Date()), {
      ...todo,
      status: "in_progress",
    }).then(async (saved) => {
      await chrome.storage.local.set({
        minimalPomodoroTodoStatusSignal: {
          at: new Date().toISOString(),
          dateKey: saved.date,
          todoId: saved.id,
          externalId: saved.externalId || "",
          status: "in_progress",
        },
      });
      sendResponse({ ok: true });
    }).catch((error) => sendResponse({ ok: false, error: error?.message || String(error) }));
    return true;
  }

  if (message.type === "SYNC_POMODORO_REVIEWS_TO_COMPLETION") {
    syncPomodoroReviewsToCompletion(message.payload?.dateKey)
      .then((completion) => sendResponse({ ok: true, completion }))
      .catch((error) => sendResponse({ ok: false, error: error?.message || String(error) }));
    return true;
  }

  return false;
});

async function syncPomodoroReviewsToCompletion(dateKeyInput) {
  const dateKey = String(dateKeyInput || localDateKey(new Date()));
  const storageKey = `minimalPomodoroTimeline:${dateKey}`;
  const result = await chrome.storage.local.get(storageKey);
  const records = (Array.isArray(result[storageKey]) ? result[storageKey] : [])
    .filter((record) => record?.type === "work" && record?.end && record.reviewPending !== true && record.reviewSkipped !== true)
    .filter((record) => String(record.reviewNote || "").trim())
    .sort((left, right) => Number(left.start) - Number(right.start));
  const current = await notionIntegration.loadDailyCompletion(dateKey).catch(() => "");
  const reviewLines = uniqueReviewLines(records);
  const newReviewLines = filterNewReviewLines(String(current || ""), reviewLines);
  const completion = appendReviewLines(String(current || ""), newReviewLines);
  await notionIntegration.queueDailyCompletion(dateKey, completion);
  await chrome.storage.local.set({
    minimalPomodoroCompletionRefreshSignal: { dateKey, at: Date.now() },
  });
  return completion;
}

function uniqueReviewLines(records) {
  const seen = new Set();
  const lines = [];
  for (const record of records) {
    const note = String(record.reviewNote || "").trim();
    const key = normalizeReviewLine(note);
    if (!note || seen.has(key)) continue;
    seen.add(key);
    lines.push(`${formatReviewRecordTime(record)}  ${note}`);
  }
  return lines;
}

function filterNewReviewLines(current, reviewLines) {
  if (!reviewLines.length) return [];
  const existing = new Set(
    String(current || "")
      .split(/\n+/)
      .flatMap((line) => [
        normalizeReviewLine(line),
        normalizeReviewLine(stripReviewTimePrefix(line)),
      ])
      .filter(Boolean)
  );
  return reviewLines.filter((line) => {
    const key = normalizeReviewLine(line);
    const noteKey = normalizeReviewLine(stripReviewTimePrefix(line));
    return key && !existing.has(key) && !existing.has(noteKey);
  });
}

function appendReviewLines(current, reviewLines) {
  if (!reviewLines.length) return current;
  const base = String(current || "");
  const reviewText = reviewLines.join("\n");
  if (!base) return reviewText;
  return base.endsWith("\n") ? `${base}${reviewText}` : `${base}\n${reviewText}`;
}

function normalizeReviewLine(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function stripReviewTimePrefix(value) {
  return String(value || "").replace(/^\d{1,2}:\d{2}\s+/, "").trim();
}

function formatReviewRecordTime(record) {
  const date = new Date(Number(record?.start) || Date.now());
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

async function prepareControllerForTodo(todo) {
  if (!todo?.id || !todo?.title) throw new Error("待办信息不完整。");
  const selection = { ...todo, requestedAt: Date.now() };
  await chrome.storage.local.set({ minimalPomodoroSelectedTodo: selection });
  let tab = null;
  if (controllerTabId !== null) {
    try {
      tab = await chrome.tabs.get(controllerTabId);
    } catch {
      controllerTabId = null;
    }
  }
  if (!tab && timelineTabId !== null) {
    try {
      tab = await chrome.tabs.get(timelineTabId);
      controllerTabId = tab.id;
    } catch {
      timelineTabId = null;
    }
  }
  if (!tab) {
    const [controllerTabs, timelineTabs] = await Promise.all([
      chrome.tabs.query({ url: chrome.runtime.getURL("controller.html*") }),
      chrome.tabs.query({ url: chrome.runtime.getURL("timeline.html*") }),
    ]);
    tab = controllerTabs[0] || timelineTabs[0] || null;
    controllerTabId = tab?.id ?? null;
    if (timelineTabs[0]) timelineTabId = timelineTabs[0].id ?? null;
  }
  if (!tab) {
    tab = await chrome.tabs.create({ url: chrome.runtime.getURL("timeline.html?mode=today"), active: true });
    timelineTabId = tab.id ?? null;
    controllerTabId = tab.id ?? null;
    return { started: false, accepted: true, openedController: true };
  }
  await chrome.tabs.update(tab.id, { active: true });
  if (tab.windowId) await chrome.windows.update(tab.windowId, { focused: true });
  const response = await chrome.runtime.sendMessage({ type: "SELECT_NOTION_TODO", payload: selection }).catch(() => null);
  return {
    started: Boolean(response?.started),
    accepted: response?.ok !== false,
    error: response?.error || "",
    openedController: false,
  };
}

chrome.storage.onChanged.addListener(async (changes, areaName) => {
  if (areaName !== "local") return;
  const changedTimelineDates = Object.entries(changes)
    .filter(([key, change]) => key.startsWith("minimalPomodoroTimeline:") && notionRelevantRecordsChanged(change.oldValue, change.newValue))
    .map(([key]) => key.slice("minimalPomodoroTimeline:".length))
    .filter((dateKey) => /^\d{4}-\d{2}-\d{2}$/.test(dateKey));
  const timelineChanged = changedTimelineDates.length > 0;
  if (!timelineChanged) return;

  try {
    await autoCompletePlannedTodosFromRecords(changedTimelineDates);
    const config = await notionIntegration.getConfig();
    if (!config.autoSync || !config.token || !config.timeRecordSourceId) return;
    chrome.alarms.create("notionAutoSync", { delayInMinutes: 0.5 });
  } catch {}
});

async function autoCompletePlannedTodosFromRecords(dateKeys) {
  const config = await notionIntegration.getConfig();
  if (!config.token || !config.dailyPlanSourceId) return;
  const records = await notionIntegration.loadAllLocalRecords();

  for (const dateKey of dateKeys) {
    const completedRecords = records.filter((record) => (
      record.dateKey === dateKey && record.type === "work" && record.end != null && !record.autoFilled &&
      record.todoAutoCompleteEligible !== false && record.automatic !== false
    ));
    if (!completedRecords.length) continue;

    const todos = await notionIntegration.loadDailyTodos(dateKey, config);
    for (const todo of todos) {
      if (todo.status === "done" || !todo.plannedStart || !todo.plannedEnd) continue;
      const matchedMinutes = completedRecords
        .filter((record) => todoTitleMatchesRecord(todo, record))
        .reduce((sum, record) => sum + recordDurationMinutes(record), 0);
      if (matchedMinutes > 0 && matchedMinutes >= todoAutoCompleteThresholdMinutes(todo)) {
        await notionIntegration.queueDailyTodoUpsert(dateKey, { ...todo, status: "done", pendingSync: true });
      }
    }
  }
}

function todoTitleMatchesRecord(todo, record) {
  const todoTitle = normalizeAutoCompleteTitle(todo.title);
  const recordTitle = normalizeAutoCompleteTitle(record.content);
  if (!todoTitle || !recordTitle) return false;
  if (todoTitle.includes(recordTitle) || recordTitle.includes(todoTitle)) return true;
  const todoTokens = autoCompleteTitleTokens(todoTitle);
  const recordTokens = autoCompleteTitleTokens(recordTitle);
  if (!todoTokens.length || !recordTokens.length) return false;
  const intersection = todoTokens.filter((token) => recordTokens.includes(token)).length;
  const union = new Set([...todoTokens, ...recordTokens]).size;
  return intersection / Math.max(union, 1) >= 0.5;
}

function todoAutoCompleteThresholdMinutes(todo) {
  const estimated = todoEstimatedMinutes(todo);
  if (!Number.isFinite(estimated) || estimated <= 0) return Number.POSITIVE_INFINITY;
  return Math.max(1, Math.max(estimated * 0.85, estimated - 5));
}

function todoEstimatedMinutes(todo) {
  if (todo.planningMode === "percentage" || todo.effortBasis === "time_budget" || todo.effortBasis === "unknown") return 0;
  const pomodoros = Number(todo.estimatedPomodoros);
  if (Number.isFinite(pomodoros) && pomodoros > 0) return pomodoros * 25;
  const start = Date.parse(todo.plannedStart);
  const end = Date.parse(todo.plannedEnd);
  if (Number.isFinite(start) && Number.isFinite(end) && end > start) return Math.round((end - start) / 60000);
  return 0;
}

function recordDurationMinutes(record) {
  const start = Number(record.start);
  const end = Number(record.end);
  return Number.isFinite(start) && Number.isFinite(end) && end > start ? Math.round((end - start) / 60000) : 0;
}

function normalizeAutoCompleteTitle(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function autoCompleteTitleTokens(value) {
  const words = normalizeAutoCompleteTitle(value).split(" ").filter((token) => token.length >= 2);
  const compact = normalizeAutoCompleteTitle(value).replace(/\s+/g, "");
  if (/[\u3400-\u9fff]/.test(compact)) {
    for (let index = 0; index < compact.length - 1; index += 1) words.push(compact.slice(index, index + 2));
  }
  return [...new Set(words)];
}

function notionRelevantRecordsChanged(previous, next) {
  const project = (value) => (Array.isArray(value) ? value : [])
    .filter((record) => record && record.end != null && !record.autoFilled)
    .map((record) => ({
      id: record.id,
      start: record.start,
      end: record.end,
      type: record.type,
      content: record.content,
      note: record.note,
      completion: record.completion,
      focus: record.focus,
      interruption: record.interruption,
      reviewNote: record.reviewNote,
      interruptions: record.interruptions,
      todoId: record.todoId,
      todoUrl: record.todoUrl,
      todoDate: record.todoDate,
      todoPlannedStart: record.todoPlannedStart,
      todoPlannedEnd: record.todoPlannedEnd,
    }));
  return JSON.stringify(project(previous)) !== JSON.stringify(project(next));
}

async function scheduleNotionAutomation() {
  const config = await notionIntegration.getConfig();
  await chrome.alarms.clear("notionDailyReview");
  await chrome.alarms.clear("notionPeriodicSync");
  await chrome.alarms.clear("notionIntradayAdjust13");
  await chrome.alarms.clear("notionIntradayAdjust18");
  await chrome.alarms.clear("notionInitialDayTodos");
  await chrome.alarms.clear("notionInitialDayTodosSoon");
  if (config.autoSync && config.token) {
    const interval = Math.max(5, Math.min(1440, Number(config.syncIntervalMinutes) || 10));
    chrome.alarms.create("notionPeriodicSync", { delayInMinutes: 1, periodInMinutes: interval });
  }
  const llmReady = config.llmEndpoint && config.llmModel && config.llmApiKey;
  if (llmReady && config.token && config.weeklyPlanSourceId && config.dailyPlanSourceId) {
    await scheduleDailyAlarm("notionInitialDayTodos", 0, 5);
  }
  if (config.intradayAdjustmentEnabled && llmReady) {
    await scheduleDailyAlarm("notionIntradayAdjust13", 13, 0);
    await scheduleDailyAlarm("notionIntradayAdjust18", 18, 0);
  }
  if (config.dailyReviewEnabled && llmReady) await scheduleDailyReviewAlarm(config);
}

async function scheduleDailyReviewAlarm(config) {
  if (!config.dailyReviewEnabled || !config.llmEndpoint || !config.llmModel || !config.llmApiKey) return;
  const [hours, minutes] = String(config.dailyReviewTime || "22:30").split(":").map(Number);
  const next = new Date();
  next.setHours(Number.isFinite(hours) ? hours : 22, Number.isFinite(minutes) ? minutes : 30, 0, 0);
  if (next.getTime() <= Date.now()) next.setDate(next.getDate() + 1);
  chrome.alarms.create("notionDailyReview", { when: next.getTime() });
}

async function scheduleDailyAlarm(name, hours, minutes) {
  const next = new Date();
  next.setHours(hours, minutes, 0, 0);
  if (next.getTime() <= Date.now()) next.setDate(next.getDate() + 1);
  await chrome.alarms.create(name, { when: next.getTime() });
}

function localDateKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

async function setIntradayAutomationState(payload) {
  await chrome.storage.local.set({
    minimalPomodoroNotionAutomationState: {
      type: "intraday_adjustment",
      at: new Date().toISOString(),
      ...payload,
    },
  });
}

async function runNotionIntradayAdjustment(hour, scheduledTime) {
  const now = new Date();
  const startedAt = now.toISOString();
  const slot = `${localDateKey(now)}-${String(hour).padStart(2, "0")}:00`;
  try {
    const config = await notionIntegration.getConfig();
    if (!config.intradayAdjustmentEnabled || !config.token || !config.dailyPlanSourceId ||
        !config.llmEndpoint || !config.llmModel || !config.llmApiKey) return;
    if (Number.isFinite(scheduledTime) && Date.now() - scheduledTime > 90 * 60 * 1000) {
      await setIntradayAutomationState({ phase: "skipped", slot, message: `${hour}:00 日内调整因设备休眠错过，未补跑。` });
      return;
    }
    const state = await chrome.storage.local.get("minimalPomodoroLastIntradayAdjustment");
    if (state.minimalPomodoroLastIntradayAdjustment === slot) return;
    await chrome.storage.local.set({ minimalPomodoroLastIntradayAdjustment: slot });
    await setIntradayAutomationState({ phase: "sent", slot, startedAt, message: `${hour}:00 日内调整：已发送请求。` });
    await chrome.notifications.create(`notionIntraday:${slot}`, {
      type: "basic",
      iconUrl: "icons/icon128.png",
      title: "正在调整今日剩余待办",
      message: `正在结合 ${hour}:00 前的时间流、任务状态和当前计划。`,
      priority: 1,
    });
    await flushQueuedWritesBeforeAutomation(config);
    const result = await notionIntegration.adjustIntradayTodos(localDateKey(now), now, config, async (progress) => {
      const detail = typeof progress === "string" ? { phase: progress } : (progress || {});
      const phase = detail.phase || "generating";
      const writingAction = ({ create: "新建", update: "更新", delete: "删除" })[detail.action] || "写入";
      const message = detail.message || (phase === "reading"
        ? "正在从 Notion 读取阶段计划、待办和完成情况。"
        : phase === "repairing"
          ? "首次生成结果未通过时间校验，LLM 正在自动修正。"
          : phase === "writing" && detail.total
            ? `正在 Notion 中${writingAction}第 ${detail.current}/${detail.total} 条待办${detail.title ? `：${detail.title}` : ""}。`
            : phase === "writing"
              ? "LLM 已生成并通过校验，正在写入 Notion。"
              : "LLM 正在重排今日剩余待办。");
      await setIntradayAutomationState({
        phase,
        slot,
        startedAt,
        message,
        progress: detail.total ? { current: detail.current || 0, total: detail.total, action: detail.action || "" } : null,
      });
    });
    const message = result.skipped
      ? ({ phase_plan_missing: "今天没有阶段计划，已跳过。", todos_missing: "今天没有待办，已跳过。", nothing_adjustable: "今天没有可调整的剩余待办。", workday_finished: "个人节奏中今天已没有剩余工作窗口，已跳过。" })[result.reason] || "本次无需调整。"
      : result.changeSummary || "今日剩余待办已调整并写入 Notion。";
    await setIntradayAutomationState({ phase: result.skipped ? "skipped" : "done", slot, startedAt, message });
    await chrome.storage.local.set({ minimalPomodoroNotionPullSignal: { at: new Date().toISOString(), source: "intraday_adjustment" } });
    await chrome.notifications.create(`notionIntradayDone:${slot}`, {
      type: "basic",
      iconUrl: "icons/icon128.png",
      title: result.skipped ? "日内待办无需调整" : "今日剩余待办已更新",
      message,
      priority: 1,
    });
  } catch (error) {
    await setIntradayAutomationState({ phase: "error", slot, startedAt, message: error?.message || String(error) });
    await chrome.notifications.create(`notionIntradayError:${slot}`, {
      type: "basic",
      iconUrl: "icons/icon128.png",
      title: "日内待办调整失败",
      message: error?.message || String(error),
      priority: 1,
    });
  }
}

async function runNotionAutoSync() {
  try {
    const config = await notionIntegration.getConfig();
    if (!config.autoSync || !config.token || !config.timeRecordSourceId) return;
    await notionIntegration.syncAllLocalRecords({ config });
  } catch (error) {
    await chrome.storage.local.set({
      minimalPomodoroNotionAutomationState: {
        type: "sync_error",
        at: new Date().toISOString(),
        message: error?.message || String(error),
      },
    });
  }
}

async function runNotionPeriodicSync() {
  try {
    const config = await notionIntegration.getConfig();
    if (!config.autoSync || !config.token) return;
    const queueSummary = await notionIntegration.flushWriteQueue(config);
    if (queueSummary.skipped) return;
    if (config.timeRecordSourceId) await notionIntegration.pullTimeRecordsFromNotion(config);
    if (config.timeRecordSourceId) await notionIntegration.syncAllLocalRecords({ config });
    // Planning data is pulled by all open timeline pages after this signal.
    await chrome.storage.local.set({
      minimalPomodoroNotionPullSignal: { at: new Date().toISOString(), source: "periodic" },
    });
    if (config.llmEndpoint && config.llmModel && config.llmApiKey && config.weeklyPlanSourceId) {
      await summarizeExpiredPhasePlansOnce(config);
    }
  } catch (error) {
    await chrome.storage.local.set({
      minimalPomodoroNotionAutomationState: {
        type: "sync_error",
        at: new Date().toISOString(),
        message: error?.message || String(error),
      },
    });
  }
}

async function flushQueuedWritesBeforeAutomation(config) {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    const summary = await notionIntegration.flushWriteQueue(config);
    if (!summary.skipped) {
      if (summary.failed) throw new Error(`有 ${summary.failed} 项本地修改未能写入 Notion：${summary.errors[0]?.message || "请稍后重试"}`);
      return summary;
    }
    await sleep(500);
  }
  throw new Error("本地修改仍在另一个页面中同步，本次 LLM 自动任务已暂停。");
}

async function ensureTodayInitialTodos(configInput) {
  if (initialDayTodoPromise) return initialDayTodoPromise;
  initialDayTodoPromise = runEnsureTodayInitialTodos(configInput)
    .finally(() => { initialDayTodoPromise = null; });
  return initialDayTodoPromise;
}

async function runEnsureTodayInitialTodos(configInput) {
  const config = configInput || await notionIntegration.getConfig();
  if (!config.token || !config.weeklyPlanSourceId || !config.dailyPlanSourceId ||
      !config.llmEndpoint || !config.llmModel || !config.llmApiKey) return { skipped: true };
  const now = new Date();
  const dateKey = localDateKey(now);
  const [plan, todos] = await Promise.all([
    notionIntegration.loadPhasePlan(dateKey, config),
    notionIntegration.loadDailyTodos(dateKey, config),
  ]);
  if (!plan || plan.startDate !== dateKey || todos.length) return { skipped: true };
  const result = await notionIntegration.generateInitialDayTodos(dateKey, config, {
    requestedAt: now.toISOString(),
    preparationMinutes: 10,
  });
  await chrome.storage.local.set({
    minimalPomodoroNotionPullSignal: { at: new Date().toISOString(), source: "initial_day_todos" },
  });
  return result;
}

async function runNotionDailyReview(scheduledTime) {
  try {
    const config = await notionIntegration.getConfig();
    if (!config.dailyReviewEnabled || !config.llmEndpoint || !config.llmModel || !config.llmApiKey) return;
    if (Number.isFinite(scheduledTime) && Date.now() - scheduledTime > 90 * 60 * 1000) {
      await chrome.storage.local.set({
        minimalPomodoroNotionAutomationState: {
          type: "review_blocked",
          at: new Date().toISOString(),
          message: "设备休眠导致每日总结错过超过 90 分钟，本次未补跑，避免为错误日期生成内容。",
        },
      });
      return;
    }
    const now = new Date();
    const dateKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    await flushQueuedWritesBeforeAutomation(config);
    const result = await notionIntegration.triggerDailyReview(dateKey, config);
    await chrome.storage.local.set({
      minimalPomodoroNotionAutomationState: {
        type: "review_success",
        at: new Date().toISOString(),
        dateKey,
        wroteToNotion: result.wroteToNotion,
        archiveCreated: Boolean(result.archive),
        archiveError: result.archiveError || "",
        nextTodoDate: result.nextTodoSkipped ? "" : result.nextTodoDate,
        nextTodoSkipped: Boolean(result.nextTodoSkipped),
        nextTodoBlockedReason: result.nextTodoBlockedReason || "",
        todoCount: result.todoSummary?.total || 0,
      },
    });
  } catch (error) {
    await chrome.storage.local.set({
      minimalPomodoroNotionAutomationState: {
        type: ["completion_required", "weekly_plan_required", "phase_plan_required", "phase_milestone_required", "planning_profile_required", "llm_blocked"].includes(error?.code)
          ? "review_blocked"
          : "review_error",
        at: new Date().toISOString(),
        message: error?.message || String(error),
      },
    });
  } finally {
    try {
      const config = await notionIntegration.getConfig();
      if (config.weeklyPlanSourceId && config.llmEndpoint && config.llmModel && config.llmApiKey) {
        await summarizeExpiredPhasePlansOnce(config);
      }
    } catch (error) {
      console.warn("Unable to summarize expired phase plans", error);
    }
  }
}

async function summarizeExpiredPhasePlansOnce(config) {
  if (phaseSummaryPromise) return phaseSummaryPromise;
  phaseSummaryPromise = notionIntegration.summarizeExpiredPhasePlans(config)
    .finally(() => { phaseSummaryPromise = null; });
  return phaseSummaryPromise;
}

async function showReviewNotification() {
  try {
    await chrome.notifications.create("pomodoroReview", {
      type: "basic",
      iconUrl: "icons/icon128.png",
      title: "番茄钟已完成",
      message: "请填写本轮工作评价。未处理时将在5分钟后再次提醒。",
      priority: 2,
      requireInteraction: true,
      buttons: [
        { title: "现在评价" },
        { title: "稍后评价" },
      ],
    });
  } catch {}
}

async function focusControllerAndOpenReview() {
  if (controllerTabId === null && timelineTabId !== null) controllerTabId = timelineTabId;
  if (controllerTabId !== null) {
    try {
      const tab = await chrome.tabs.get(controllerTabId);
      await chrome.tabs.update(controllerTabId, { active: true });
      if (tab.windowId) {
        await chrome.windows.update(tab.windowId, { focused: true });
      }
    } catch {
      controllerTabId = null;
    }
  }

  try {
    await chrome.runtime.sendMessage({ type: "OPEN_PENDING_REVIEW" });
  } catch {}
}

chrome.notifications.onClicked.addListener(async (notificationId) => {
  if (notificationId !== "pomodoroReview") return;
  await chrome.notifications.clear(notificationId);
  await chrome.alarms.clear("pomodoroReviewReminder");
  await focusControllerAndOpenReview();
});

chrome.notifications.onButtonClicked.addListener(async (notificationId, buttonIndex) => {
  if (notificationId !== "pomodoroReview") return;
  await chrome.notifications.clear(notificationId);

  if (buttonIndex === 0) {
    await chrome.alarms.clear("pomodoroReviewReminder");
    await focusControllerAndOpenReview();
    return;
  }

  chrome.alarms.create("pomodoroReviewReminder", { delayInMinutes: 5 });
});

async function updateBlockingRules(payload) {
  const enabled = Boolean(payload?.enabled);
  const blacklist = normalizeSiteList(payload?.blacklist || []);
  const whitelist = normalizeSiteList(payload?.whitelist || []);

  if (!enabled || blacklist.length === 0) {
    await clearBlockingRules();
    return;
  }

  const rules = [];
  let id = 1000;

  for (const site of whitelist) {
    rules.push({
      id: id++,
      priority: 2,
      action: { type: "allow" },
      condition: {
        urlFilter: site.urlFilter,
        resourceTypes: ["main_frame"],
      },
    });
  }

  for (const site of blacklist) {
    rules.push({
      id: id++,
      priority: 1,
      action: {
        type: "redirect",
        redirect: {
          extensionPath: `/blocked.html?site=${encodeURIComponent(site.label)}`,
        },
      },
      condition: {
        urlFilter: site.urlFilter,
        resourceTypes: ["main_frame"],
      },
    });
  }

  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: activeRuleIds,
    addRules: rules,
  });

  activeRuleIds = rules.map((rule) => rule.id);
}

async function clearBlockingRules() {
  const existing = await chrome.declarativeNetRequest.getDynamicRules();
  const ids = existing.map((rule) => rule.id);
  if (ids.length > 0) {
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: ids,
    });
  }
  activeRuleIds = [];
}

function normalizeSiteList(items) {
  return [...new Set(items.map((item) => String(item).trim()).filter(Boolean))]
    .map((item) => {
      const label = item;
      let value = item
        .replace(/^https?:\/\//i, "")
        .replace(/^www\./i, "")
        .replace(/\/.*$/, "")
        .trim();

      if (!value) return null;

      return {
        label,
        urlFilter: `||${value}^`,
      };
    })
    .filter(Boolean);
}



async function grantTemporaryAccess(payload) {
  const siteText = String(payload?.site || "").trim();
  const reason = String(payload?.reason || "未填写理由").trim();
  const minutes = Math.max(1, Math.min(240, Number(payload?.minutes || 10)));
  const stopPomodoro = Boolean(payload?.stopPomodoro);
  const site = normalizeSiteList([siteText])[0];

  if (!site) {
    throw new Error("无效的网站");
  }

  const ruleId = Math.floor(Date.now() % 100000000) + 500000;
  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: [ruleId],
    addRules: [{
      id: ruleId,
      priority: 3,
      action: { type: "allow" },
      condition: {
        urlFilter: site.urlFilter,
        resourceTypes: ["main_frame"],
      },
    }],
  });

  chrome.alarms.create(`tempAccess:${ruleId}`, {
    delayInMinutes: minutes,
  });

  await appendTimelineRecord({
    type: "entertainment",
    content: `申请访问 ${site.label}：${reason}｜${minutes}分钟｜${stopPomodoro ? "停止番茄钟" : "继续番茄钟"}`,
    start: Date.now(),
    end: Date.now(),
    round: null,
  });

  if (stopPomodoro) {
    const [controllerTabs, timelineTabs] = await Promise.all([
      chrome.tabs.query({ url: chrome.runtime.getURL("controller.html*") }),
      chrome.tabs.query({ url: chrome.runtime.getURL("timeline.html*") }),
    ]);

    if (controllerTabs.length > 0 || timelineTabs.length > 0) {
      try {
        const response = await chrome.runtime.sendMessage({
          type: "STOP_POMODORO_FOR_ACCESS",
          reason,
          site: site.label,
        });
        if (!response?.ok) {
          throw new Error(response?.error || "番茄钟停止失败");
        }
      } catch (error) {
        throw new Error(`网站已临时放行，但停止番茄钟失败：${error?.message || error}`);
      }
    }
  }

  return {
    site: site.label,
    minutes,
    stopPomodoro,
    openUrl: `https://${site.label.replace(/^https?:\/\//i, "").replace(/\/.*$/, "")}`,
  };
}

async function appendTimelineRecord(record) {
  const key = `minimalPomodoroTimeline:${todayKey()}`;
  const result = await chrome.storage.local.get(key);
  const records = Array.isArray(result[key]) ? result[key] : [];
  records.push({
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    ...record,
  });
  await chrome.storage.local.set({ [key]: records });
}

function todayKey() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}


function waitForTabComplete(tabId, timeoutMs) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      chrome.tabs.onUpdated.removeListener(listener);
      reject(new Error("没有网络或页面加载超时"));
    }, timeoutMs);

    const listener = (updatedTabId, changeInfo) => {
      if (updatedTabId === tabId && changeInfo.status === "complete") {
        clearTimeout(timeout);
        chrome.tabs.onUpdated.removeListener(listener);
        resolve();
      }
    };

    chrome.tabs.onUpdated.addListener(listener);

    chrome.tabs.get(tabId)
      .then((tab) => {
        if (tab.status === "complete") {
          clearTimeout(timeout);
          chrome.tabs.onUpdated.removeListener(listener);
          resolve();
        }
      })
      .catch(() => {});
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parsePercentNear(text, labels) {
  for (const label of labels) {
    const idx = text.toLowerCase().indexOf(label.toLowerCase());
    if (idx === -1) continue;

    const windowText = text.slice(idx, idx + 260);
    const match = windowText.match(/(\d{1,3})\s*%\s*(?:剩余|remaining)?/i);
    if (match) {
      return clampPercent(Number(match[1]));
    }
  }

  return null;
}

function parseNumberNear(text, labels) {
  for (const label of labels) {
    const idx = text.toLowerCase().indexOf(label.toLowerCase());
    if (idx === -1) continue;

    const windowText = text.slice(idx, idx + 140);
    const match = windowText.match(/(?:剩余额度|additional|extra)[^\d]*(\d+)/i) || windowText.match(/\n\s*(\d+)\s*(?:\n|$)/);
    if (match) {
      return Number(match[1]);
    }
  }

  return null;
}

function clampPercent(value) {
  if (!Number.isFinite(value)) return null;
  return Math.max(0, Math.min(100, value));
}

// v69 default blacklist initialization
const DEFAULT_BLACKLIST = [
  "youtube.com",
  "bilibili.com",
  "douyin.com",
  "tiktok.com",
  "twitter.com",
  "x.com",
  "reddit.com"
];
