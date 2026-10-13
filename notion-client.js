(function attachMinimalPomodoroNotion(global) {
  "use strict";

  const API_BASE = "https://api.notion.com/v1";
  const API_VERSION = "2026-03-11";
  const CONFIG_KEY = "minimalPomodoroNotionConfig";
  const SYNC_MAP_KEY = "minimalPomodoroNotionSyncMap";
  const SYNC_STATE_KEY = "minimalPomodoroNotionSyncState";
  const DELETED_RECORDS_KEY = "minimalPomodoroDeletedTimeRecords";
  const WRITE_QUEUE_KEY = "minimalPomodoroNotionWriteQueue:v1";
  const WRITE_QUEUE_STATE_KEY = "minimalPomodoroNotionWriteQueueState";
  const TIMELINE_PREFIX = "minimalPomodoroTimeline:";
  const prompts = global.LlmPrompts;
  let localWriteQueueLock = Promise.resolve();

  async function withWriteQueueLock(operation) {
    if (global.navigator?.locks?.request) {
      return global.navigator.locks.request("minimal-pomodoro-notion-write-queue", operation);
    }
    const run = localWriteQueueLock.then(operation, operation);
    localWriteQueueLock = run.catch(() => undefined);
    return run;
  }

  const DEFAULT_CONFIG = Object.freeze({
    token: "",
    workspaceParentPageId: "",
    timeRecordSourceId: "",
    weeklyPlanSourceId: "",
    planningProfileSourceId: "",
    dailyPlanSourceId: "",
    dailyReviewSourceId: "",
    dailyArchiveSourceId: "",
    autoSync: false,
    syncIntervalMinutes: 10,
    dailyReviewEnabled: false,
    intradayAdjustmentEnabled: false,
    dailyReviewTime: "22:30",
    llmEndpoint: "https://api.deepseek.com/chat/completions",
    llmModel: "deepseek-v4-flash",
    llmApiKey: "",
  });


  const WORKSPACE_DATABASES = Object.freeze({
    timeRecord: {
      title: "Minimal Pomodoro · Time Record",
      titleAliases: ["Minimal Pomodoro · Time Record", "Time Record", "时间记录"],
      properties: {
        "标题": { title: {} },
        "记录 ID": { rich_text: {} },
        "时间": { date: {} },
        "类型": {
          select: {
            options: [
              { name: "work", color: "blue" },
              { name: "break", color: "green" },
              { name: "life", color: "yellow" },
              { name: "entertainment", color: "purple" },
            ],
          },
        },
        "持续时间": { number: { format: "number" } },
        "评价": { rich_text: {} },
        "备注": { rich_text: {} },
        "待办 ID": { rich_text: {} },
        "待办链接": { url: {} },
      },
    },
    weeklyPlan: {
      title: "Minimal Pomodoro · Phase Plan",
      titleAliases: [
        "Minimal Pomodoro · Phase Plan", "Phase Plan", "阶段计划",
        "Minimal Pomodoro · Weekly Plan", "Weekly Plan", "周计划",
      ],
      properties: {
        "阶段计划": { title: {} },
        "计划 ID": { rich_text: {} },
        "开始日期": { date: {} },
        "结束日期": { date: {} },
        "计划描述": { rich_text: {} },
        "约束与说明": { rich_text: {} },
        "每日里程碑 JSON": { rich_text: {} },
        "阶段调整记录": { rich_text: {} },
        "阶段总结": { rich_text: {} },
        "总结生成时间": { date: {} },
        "状态": {
          select: {
            options: [
              { name: "active", color: "blue" },
              { name: "completed", color: "green" },
            ],
          },
        },
      },
    },
    dailyPlan: {
      title: "Minimal Pomodoro · Daily Todo",
      titleAliases: [
        "Minimal Pomodoro · Daily Todo",
        "Daily Todo",
        "每日待办",
        "Minimal Pomodoro · Daily Plan",
        "Daily Plan",
        "每日计划",
      ],
      properties: {
        "待办": { title: {} },
        "待办 ID": { rich_text: {} },
        "日期": { date: {} },
        "状态": {
          select: {
            options: [
              { name: "pending", color: "gray" },
              { name: "in_progress", color: "blue" },
              { name: "done", color: "green" },
            ],
          },
        },
        "优先级": {
          select: {
            options: [
              { name: "high", color: "red" },
              { name: "medium", color: "yellow" },
              { name: "low", color: "gray" },
            ],
          },
        },
        "说明": { rich_text: {} },
        "来源": { rich_text: {} },
        "预计番茄数": { number: { format: "number" } },
        "规划方式": { select: { options: [{ name: "explicit" }, { name: "percentage" }] } },
        "累计计划百分比": { number: { format: "number" } },
        "阶段任务 ID": { rich_text: {} },
        "投入依据": { select: { options: [{ name: "task_estimate" }, { name: "time_budget" }, { name: "unknown" }] } },
        "实际投入分钟": { number: { format: "number" } },
        "实际番茄数": { number: { format: "number" } },
        "计划时间": { date: {} },
        "Origin": {
          select: { options: [{ name: "user", color: "blue" }, { name: "llm", color: "purple" }] },
        },
        "调整说明": { rich_text: {} },
        "阶段计划 ID": { rich_text: {} },
        "阶段计划名称": { rich_text: {} },
      },
    },
    planningProfile: {
      title: "Minimal Pomodoro · Planning Profile",
      titleAliases: ["Minimal Pomodoro · Planning Profile", "Planning Profile", "个人节奏"],
      properties: {
        "配置名称": { title: {} },
        "Profile ID": { rich_text: {} },
        "时区": { rich_text: {} },
        "工作窗口摘要": { rich_text: {} },
        "固定安排摘要": { rich_text: {} },
        "习惯说明": { rich_text: {} },
        "配置 JSON": { rich_text: {} },
        "更新时间": { date: {} },
      },
    },
    dailyReview: {
      title: "Minimal Pomodoro · Daily Review",
      titleAliases: ["Minimal Pomodoro · Daily Review", "Daily Review", "每日复盘"],
      properties: {
        "标题": { title: {} },
        "日期": { date: {} },
        "用户完成情况": { rich_text: {} },
        "生活记录": { rich_text: {} },
        "今日总结": { rich_text: {} },
        "时间分析": { rich_text: {} },
        "问题分析": { rich_text: {} },
        "次日关注点": { rich_text: {} },
        "阶段计划 ID": { rich_text: {} },
        "阶段计划名称": { rich_text: {} },
      },
    },
    dailyArchive: {
      title: "Minimal Pomodoro · Daily Archive",
      titleAliases: ["Minimal Pomodoro · Daily Archive", "Daily Archive", "每日归档", "每日完整记录"],
      properties: {
        "标题": { title: {} },
        "归档 ID": { rich_text: {} },
        "日期": { date: {} },
        "阶段计划 ID": { rich_text: {} },
        "阶段计划名称": { rich_text: {} },
        "总投入分钟": { number: { format: "number" } },
        "工作投入分钟": { number: { format: "number" } },
        "待办总数": { number: { format: "number" } },
        "已完成待办数": { number: { format: "number" } },
        "番茄数": { number: { format: "number" } },
        "生成时间": { date: {} },
        "文档版本": { rich_text: {} },
      },
    },
  });

  const PROPERTY_ALIASES = Object.freeze({
    title: ["标题", "任务", "名称", "Title", "Name", "Task"],
    recordId: ["记录 ID", "记录ID", "Record ID", "RecordId", "External ID", "ID"],
    time: ["时间", "日期时间", "Time", "Period"],
    start: ["开始时间", "开始", "Start", "Started At"],
    end: ["结束时间", "结束", "End", "Ended At"],
    date: ["日期", "Date", "Day"],
    type: ["类型", "Type", "Category"],
    duration: ["持续时间", "时长", "Duration", "Minutes"],
    evaluation: ["评价", "Evaluation", "Review"],
    note: ["备注", "Note", "Notes", "日志", "Log"],
    completed: ["完成状态", "已完成", "Completed", "Done"],
    status: ["状态", "Status"],
    priority: ["优先级", "Priority"],
    details: ["说明", "Details", "Description"],
    source: ["来源", "Source"],
    todoId: ["待办 ID", "待办ID", "Todo ID", "TodoId", "Task ID"],
    todoUrl: ["待办链接", "Todo URL", "Task URL"],
    estimatedPomodoros: ["预计番茄数", "Estimated Pomodoros"],
    planningMode: ["规划方式", "Planning Mode"],
    targetProgressPercent: ["累计计划百分比", "Target Progress Percent"],
    phaseTaskId: ["阶段任务 ID", "Phase Task ID"],
    effortBasis: ["投入依据", "Effort Basis"],
    actualMinutes: ["实际投入分钟", "Actual Minutes"],
    actualPomodoros: ["实际番茄数", "Actual Pomodoros", "Pomodoro Count"],
    plannedTime: ["计划时间", "Planned Time", "Schedule"],
    origin: ["Origin", "来源类型", "创建来源"],
    adjustmentNote: ["调整说明", "Adjustment Note"],
    planId: ["计划 ID", "计划ID", "Plan ID", "Phase ID"],
    weekStart: ["开始日期", "阶段开始", "周开始", "Start Date", "Week Start"],
    weekEnd: ["结束日期", "阶段结束", "周结束", "End Date", "Week End"],
    weeklyGoals: ["计划描述", "阶段目标", "本周目标", "周目标", "Description", "Goals", "Weekly Goals"],
    milestonesJson: ["每日里程碑 JSON", "每日里程碑", "Milestones JSON", "Daily Milestones"],
    phaseAdjustments: ["阶段调整记录", "Phase Adjustments", "Adjustment History"],
    phaseSummary: ["阶段总结", "Phase Summary"],
    phaseSummaryAt: ["总结生成时间", "Phase Summary At"],
    constraints: ["约束与说明", "约束", "Constraints", "Notes"],
    profileId: ["Profile ID", "配置 ID", "Config ID"],
    timezone: ["时区", "Timezone"],
    workWindowsSummary: ["工作窗口摘要", "Work Windows Summary"],
    routineSummary: ["固定安排摘要", "Routine Summary"],
    preferenceNote: ["习惯说明", "Preference Note"],
    configJson: ["配置 JSON", "Config JSON"],
    updatedAt: ["更新时间", "Updated At"],
    userCompletion: ["用户完成情况", "当天完成情况", "User Completion", "Completion Log"],
    lifeRecord: ["生活记录", "Life Record", "Life Journal"],
    dailySummary: ["今日总结", "Daily Summary", "Summary"],
    timeAnalysis: ["时间分析", "Time Analysis"],
    problemAnalysis: ["问题分析", "Problem Analysis", "Problems"],
    nextFocus: ["次日关注点", "Next Focus", "Tomorrow Focus"],
    phasePlanLinkId: ["阶段计划 ID", "阶段计划ID", "Phase Plan ID"],
    phasePlanName: ["阶段计划名称", "Phase Plan Name"],
    archiveId: ["归档 ID", "归档ID", "Archive ID"],
    totalMinutes: ["总投入分钟", "Total Minutes"],
    workMinutes: ["工作投入分钟", "Work Minutes"],
    todoCount: ["待办总数", "Todo Count"],
    completedTodoCount: ["已完成待办数", "Completed Todo Count"],
    pomodoroCount: ["番茄数", "Pomodoro Count"],
    generatedAt: ["生成时间", "Generated At"],
    documentVersion: ["文档版本", "Document Version"],
  });

  function storageGet(keys) {
    return chrome.storage.local.get(keys);
  }

  function storageSet(payload) {
    return chrome.storage.local.set(payload);
  }

  function queuedWriteId(kind, entityKey) {
    return `${kind}:${entityKey}`;
  }

  function isNotionPageId(value) {
    return /^[0-9a-f]{32}$/i.test(String(value || "").replace(/-/g, ""));
  }

  async function getQueuedWrites() {
    const stored = await storageGet(WRITE_QUEUE_KEY);
    return Array.isArray(stored[WRITE_QUEUE_KEY]) ? stored[WRITE_QUEUE_KEY] : [];
  }

  async function getWriteQueueState() {
    const stored = await storageGet([WRITE_QUEUE_KEY, WRITE_QUEUE_STATE_KEY]);
    const queue = Array.isArray(stored[WRITE_QUEUE_KEY]) ? stored[WRITE_QUEUE_KEY] : [];
    return {
      ...(stored[WRITE_QUEUE_STATE_KEY] || {}),
      pending: queue.length,
    };
  }

  async function setWriteQueueState(state) {
    await storageSet({
      [WRITE_QUEUE_STATE_KEY]: {
        ...(state || {}),
        at: new Date().toISOString(),
      },
    });
  }

  async function enqueueWrite(operation, localPayload = {}) {
    return withWriteQueueLock(async () => {
      const queue = await getQueuedWrites();
      const now = new Date().toISOString();
      const next = {
        ...operation,
        id: operation.id || queuedWriteId(operation.kind, operation.entityKey),
        queuedAt: operation.queuedAt || now,
        updatedAt: now,
        attempts: 0,
        lastError: "",
      };
      const index = queue.findIndex((item) => item.id === next.id);
      if (index >= 0) queue[index] = { ...queue[index], ...next, queuedAt: queue[index].queuedAt || now };
      else queue.push(next);
      await storageSet({ ...localPayload, [WRITE_QUEUE_KEY]: queue });
      const state = await getWriteQueueState();
      await setWriteQueueState({
        ...state,
        status: state.status === "syncing" ? "syncing" : "pending",
        pending: queue.length,
        lastError: state.status === "syncing" ? state.lastError || "" : "",
      });
      return next;
    });
  }

  async function queueDailyTodoUpsert(dateKey, todo) {
    const stableId = String(todo?.externalId || todo?.id || `user:${dateKey}:${Date.now().toString(36)}:${Math.random().toString(36).slice(2, 7)}`);
    const localTodo = {
      ...todo,
      id: String(todo?.id || stableId),
      externalId: String(todo?.externalId || (isNotionPageId(todo?.id) ? "" : stableId)),
      date: dateKey,
      origin: todo?.origin || "user",
    };
    await enqueueWrite({
      id: queuedWriteId("todo", `${dateKey}:${stableId}`),
      kind: "todo_upsert",
      entityKey: `${dateKey}:${stableId}`,
      payload: { dateKey, todo: localTodo },
    });
    return localTodo;
  }

  async function queueDailyTodoDelete(dateKey, todo) {
    const stableId = String(todo?.externalId || todo?.id || "");
    if (!stableId) throw new Error("待办 ID 无效。");
    const id = queuedWriteId("todo", `${dateKey}:${stableId}`);
    const cancelledLocalCreate = await withWriteQueueLock(async () => {
      const queue = await getQueuedWrites();
      const existingIndex = queue.findIndex((item) => item.id === id);
      const pending = existingIndex >= 0 ? queue[existingIndex] : null;
      if (!(pending?.kind === "todo_upsert" && !isNotionPageId(pending.payload?.todo?.id))) return false;
      queue.splice(existingIndex, 1);
      await storageSet({ [WRITE_QUEUE_KEY]: queue });
      const state = await getWriteQueueState();
      await setWriteQueueState({
        ...state,
        status: state.status === "syncing" ? "syncing" : queue.length ? "pending" : "idle",
        pending: queue.length,
        lastError: state.status === "syncing" ? state.lastError || "" : "",
      });
      return true;
    });
    if (cancelledLocalCreate) return { cancelledLocalCreate: true };
    await enqueueWrite({
      id,
      kind: "todo_delete",
      entityKey: `${dateKey}:${stableId}`,
      payload: {
        dateKey,
        pageId: isNotionPageId(todo?.id) ? todo.id : "",
        externalId: String(todo?.externalId || (!isNotionPageId(todo?.id) ? todo.id : "")),
      },
    });
    return { cancelledLocalCreate: false };
  }

  async function queueDailyCompletion(dateKey, completion) {
    await enqueueWrite({
      id: queuedWriteId("completion", dateKey),
      kind: "daily_completion",
      entityKey: dateKey,
      payload: { dateKey, completion: String(completion || "") },
    });
    return true;
  }

  async function queueLifeRecord(dateKey, text) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) throw new Error("生活记录日期无效。");
    const value = String(text || "");
    if (value.length > 18000) throw new Error("单日生活记录最多 18000 字，请缩短后重试。");
    const key = `minimalPomodoroLifeRecords:${dateKey}`;
    const previous = (await storageGet(key))[key] || {};
    const record = {
      schemaVersion: 1, date: dateKey, text: value, url: previous.url || "",
      updatedAt: new Date().toISOString(), revision: `${Date.now()}:${Math.random().toString(36).slice(2)}`, pendingSync: true,
    };
    await enqueueWrite({
      id: queuedWriteId("life", dateKey), kind: "life_record", entityKey: dateKey,
      payload: { dateKey, text: value, revision: record.revision },
    }, { [key]: record });
    return record;
  }

  async function cacheLifeRecord(dateKey, remote) {
    return withWriteQueueLock(async () => {
      const key = `minimalPomodoroLifeRecords:${dateKey}`;
      const current = (await storageGet(key))[key];
      if (current?.pendingSync) return null;
      if (current?.updatedAt && remote.updatedAt && current.updatedAt > remote.updatedAt) return null;
      const record = { schemaVersion: 1, date: dateKey, text: String(remote.text || ""), url: remote.url || "", updatedAt: remote.updatedAt || "", pendingSync: false };
      await storageSet({ [key]: record });
      return record;
    });
  }

  async function queuePlanningProfile(profile) {
    const normalized = normalizePlanningProfile(profile);
    if (!normalized.workWindows.length) throw new Error("请至少设置一个工作/学习时间窗口。");
    const profileId = String(normalized.profileId || "default");
    await enqueueWrite({
      id: queuedWriteId("profile", profileId),
      kind: "planning_profile",
      entityKey: profileId,
      payload: { profile: normalized },
    });
    return normalized;
  }

  async function findDailyTodoPageByExternalId(externalId, config) {
    if (!externalId || !config.dailyPlanSourceId) return null;
    const source = await resolveDataSource(config.dailyPlanSourceId, config);
    const idProperty = findProperty(source.properties, PROPERTY_ALIASES.todoId, ["rich_text"]);
    return findPageByExternalId(source.id, idProperty, externalId, config);
  }

  async function executeQueuedWrite(operation, config) {
    if (operation.kind === "todo_upsert") {
      const todo = { ...(operation.payload?.todo || {}) };
      if (!isNotionPageId(todo.id) && !String(todo.id || "").startsWith("llm:")) {
        todo.externalId = todo.externalId || todo.id;
        delete todo.id;
      }
      return saveDailyTodo(operation.payload.dateKey, todo, config);
    }
    if (operation.kind === "todo_delete") {
      let pageId = operation.payload?.pageId;
      if (!pageId && operation.payload?.externalId) {
        pageId = (await findDailyTodoPageByExternalId(operation.payload.externalId, config))?.id || "";
      }
      if (pageId) return deleteDailyTodo(pageId, config);
      return true;
    }
    if (operation.kind === "daily_completion") {
      return saveDailyCompletion(operation.payload.dateKey, operation.payload.completion, config);
    }
    if (operation.kind === "life_record") {
      return saveLifeRecord(operation.payload.dateKey, operation.payload.text, config);
    }
    if (operation.kind === "planning_profile") {
      return savePlanningProfile(operation.payload.profile, config, { allowEmpty: true });
    }
    throw new Error(`未知待同步操作：${operation.kind}`);
  }

  async function flushWriteQueue(configInput) {
    const config = configInput || await getConfig();
    const snapshot = await getQueuedWrites();
    if (!snapshot.length) {
      await setWriteQueueState({ status: "idle", pending: 0, lastError: "" });
      return { total: 0, succeeded: 0, failed: 0, errors: [] };
    }
    const existingState = await getWriteQueueState();
    const existingLockAge = Date.now() - Date.parse(existingState.at || 0);
    if (existingState.status === "syncing" && Number.isFinite(existingLockAge) && existingLockAge < 120000) {
      return { total: 0, succeeded: 0, failed: 0, errors: [], skipped: true, reason: "already_syncing" };
    }
    const owner = `flush:${Date.now().toString(36)}:${Math.random().toString(36).slice(2, 8)}`;
    await setWriteQueueState({ status: "syncing", owner, pending: snapshot.length, lastError: "" });
    // Extension pages and the service worker can wake at the same moment. The
    // last writer owns this short lease; the others stand down to avoid duplicate
    // Notion creates or patches.
    await wait(60);
    const acquired = await getWriteQueueState();
    if (acquired.owner !== owner) {
      return { total: 0, succeeded: 0, failed: 0, errors: [], skipped: true, reason: "lock_lost" };
    }
    const summary = { total: snapshot.length, succeeded: 0, failed: 0, errors: [] };
    for (const operation of snapshot) {
      try {
        const saved = await executeQueuedWrite(operation, config);
        await withWriteQueueLock(async () => {
          const latest = await getQueuedWrites();
          const current = latest.find((item) => item.id === operation.id);
          if (current?.updatedAt === operation.updatedAt &&
              (operation.kind !== "life_record" || current.payload?.revision === operation.payload.revision)) {
            const payload = { [WRITE_QUEUE_KEY]: latest.filter((item) => item.id !== operation.id) };
            if (operation.kind === "life_record") {
              const key = `minimalPomodoroLifeRecords:${operation.payload.dateKey}`;
              const local = (await storageGet(key))[key];
              if (local?.revision === operation.payload.revision) payload[key] = { ...local, pendingSync: false, url: saved?.url || local.url || "", updatedAt: saved?.last_edited_time || local.updatedAt };
            }
            await storageSet(payload);
          }
        });
        summary.succeeded += 1;
      } catch (error) {
        await withWriteQueueLock(async () => {
          const latest = await getQueuedWrites();
          const index = latest.findIndex((item) => item.id === operation.id && item.updatedAt === operation.updatedAt);
          if (index >= 0) {
            latest[index] = {
              ...latest[index],
              attempts: Number(latest[index].attempts || 0) + 1,
              lastError: error?.message || String(error),
            };
            await storageSet({ [WRITE_QUEUE_KEY]: latest });
          }
        });
        summary.failed += 1;
        summary.errors.push({ id: operation.id, message: error?.message || String(error) });
      }
      const liveState = await getWriteQueueState();
      if (liveState.owner === owner) {
        await setWriteQueueState({ ...liveState, status: "syncing", owner, pending: liveState.pending });
      }
      await wait(180);
    }
    const remaining = (await getQueuedWrites()).length;
    await setWriteQueueState({
      status: summary.failed ? "error" : remaining ? "pending" : "idle",
      owner: "",
      pending: remaining,
      lastError: summary.errors[0]?.message || "",
      lastFlushedAt: new Date().toISOString(),
    });
    return summary;
  }

  async function getConfig() {
    const result = await storageGet(CONFIG_KEY);
    const saved = result[CONFIG_KEY] || {};
    return {
      ...DEFAULT_CONFIG,
      ...saved,
      // Existing installations used one switch for both features. Preserve
      // their behavior until the user saves the newly separated controls.
      intradayAdjustmentEnabled: Object.prototype.hasOwnProperty.call(saved, "intradayAdjustmentEnabled")
        ? Boolean(saved.intradayAdjustmentEnabled)
        : Boolean(saved.dailyReviewEnabled),
    };
  }

  async function saveConfig(nextConfig) {
    const config = {
      ...DEFAULT_CONFIG,
      token: String(nextConfig?.token || "").trim(),
      workspaceParentPageId: normalizeNotionId(nextConfig?.workspaceParentPageId),
      timeRecordSourceId: normalizeNotionId(nextConfig?.timeRecordSourceId),
      weeklyPlanSourceId: normalizeNotionId(nextConfig?.weeklyPlanSourceId),
      planningProfileSourceId: normalizeNotionId(nextConfig?.planningProfileSourceId),
      dailyPlanSourceId: normalizeNotionId(nextConfig?.dailyPlanSourceId),
      dailyReviewSourceId: normalizeNotionId(nextConfig?.dailyReviewSourceId),
      dailyArchiveSourceId: normalizeNotionId(nextConfig?.dailyArchiveSourceId),
      dailyReviewTime: /^\d{2}:\d{2}$/.test(nextConfig?.dailyReviewTime || "")
        ? nextConfig.dailyReviewTime
        : DEFAULT_CONFIG.dailyReviewTime,
      llmEndpoint: String(nextConfig?.llmEndpoint || "").trim(),
      llmModel: String(nextConfig?.llmModel || "").trim(),
      llmApiKey: String(nextConfig?.llmApiKey || "").trim(),
      autoSync: Boolean(nextConfig?.autoSync),
      syncIntervalMinutes: Math.max(5, Math.min(1440, Math.round(Number(nextConfig?.syncIntervalMinutes) || 10))),
      dailyReviewEnabled: Boolean(nextConfig?.dailyReviewEnabled),
      intradayAdjustmentEnabled: Boolean(nextConfig?.intradayAdjustmentEnabled),
    };
    await storageSet({ [CONFIG_KEY]: config });
    return config;
  }

  function normalizeNotionId(value) {
    const input = String(value || "").trim();
    if (!input) return "";
    const idPattern = /[0-9a-f]{32}|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/ig;
    const pathMatches = input.split(/[?#]/, 1)[0].match(idPattern);
    const matches = pathMatches?.length ? pathMatches : input.match(idPattern);
    if (!matches?.length) return input;
    const raw = matches[matches.length - 1].replace(/-/g, "").toLowerCase();
    return `${raw.slice(0, 8)}-${raw.slice(8, 12)}-${raw.slice(12, 16)}-${raw.slice(16, 20)}-${raw.slice(20)}`;
  }

  function requireToken(config) {
    if (!config?.token) {
      throw new Error("请先填写 Notion Token。");
    }
  }

  async function notionRequest(path, options = {}, config, attempt = 0) {
    requireToken(config);
    const controller = new AbortController();
    const upstreamSignal = options.signal;
    const abortFromUpstream = () => controller.abort();
    if (upstreamSignal?.aborted) controller.abort();
    else upstreamSignal?.addEventListener("abort", abortFromUpstream, { once: true });
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    let response;
    let body = {};
    try {
      response = await fetch(`${API_BASE}${path}`, {
        ...options,
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${config.token}`,
          "Notion-Version": API_VERSION,
          "Content-Type": "application/json",
          ...(options.headers || {}),
        },
      });
      body = await response.json().catch(() => ({}));
    } catch (error) {
      if (error?.name === "AbortError" && !upstreamSignal?.aborted) {
        const timeoutError = new Error("Notion 请求超过 30 秒未返回。请刷新确认数据；请求可能已在 Notion 端完成。");
        timeoutError.code = "notion_timeout";
        throw timeoutError;
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
      upstreamSignal?.removeEventListener("abort", abortFromUpstream);
    }

    if (response.status === 429 && attempt < 3) {
      const retryAfter = Math.max(1, Number(response.headers.get("Retry-After") || 1));
      await wait(retryAfter * 1000);
      return notionRequest(path, options, config, attempt + 1);
    }

    if (!response.ok) {
      const error = new Error(body.message || `Notion 请求失败（HTTP ${response.status}）`);
      error.status = response.status;
      error.code = body.code || "notion_api_error";
      throw error;
    }
    return body;
  }

  function wait(milliseconds) {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
  }

  function isTrashedObjectError(error) {
    return error?.status === 400 && /archived|unarchive|in[_ ]trash|trashed/i.test(String(error?.message || ""));
  }

  async function resolveDataSource(sourceOrDatabaseId, config) {
    const id = normalizeNotionId(sourceOrDatabaseId);
    if (!id) throw new Error("缺少 Notion 数据源 ID。");

    try {
      return await notionRequest(`/data_sources/${id}`, { method: "GET" }, config);
    } catch (error) {
      if (error.status === 401 || error.status === 403) throw error;
    }

    const database = await notionRequest(`/databases/${id}`, { method: "GET" }, config);
    const source = database.data_sources?.[0];
    if (!source?.id) {
      throw new Error("该数据库没有可用的数据源，请在 Notion 中确认数据库结构。");
    }
    return notionRequest(`/data_sources/${source.id}`, { method: "GET" }, config);
  }

  function notionTitle(value) {
    return (value || []).map((item) => item.plain_text || item.text?.content || "").join("").trim();
  }

  async function searchDataSources(query, config) {
    const results = [];
    let startCursor;
    do {
      const response = await notionRequest("/search", {
        method: "POST",
        body: JSON.stringify({
          ...(query ? { query } : {}),
          filter: { property: "object", value: "data_source" },
          page_size: 100,
          ...(startCursor ? { start_cursor: startCursor } : {}),
        }),
      }, config);
      results.push(...(response.results || []));
      startCursor = response.has_more ? response.next_cursor : null;
    } while (startCursor);
    return results;
  }

  async function belongsToParentPage(source, parentPageId, config) {
    const expected = normalizeNotionId(parentPageId);
    if (!expected) return true;
    if (source.parent?.type === "page_id") {
      return normalizeNotionId(source.parent.page_id) === expected;
    }
    const databaseId = source.parent?.database_id;
    if (!databaseId) return true;
    const database = await notionRequest(`/databases/${databaseId}`, { method: "GET" }, config);
    return normalizeNotionId(database.parent?.page_id) === expected;
  }

  function isWorkspaceCompatible(kind, source) {
    const schema = source.properties || {};
    try {
      validateSourceSchema(kind, schema);
    } catch {
      return false;
    }
    if (kind === "timeRecord") {
      return true;
    }
    if (kind === "weeklyPlan") {
      return Boolean(
        findProperty(schema, PROPERTY_ALIASES.weekStart, ["date"]) &&
        findProperty(schema, PROPERTY_ALIASES.weeklyGoals, ["rich_text"])
      );
    }
    if (kind === "dailyPlan") {
      return Boolean(
        findProperty(schema, PROPERTY_ALIASES.completed, ["checkbox", "status"]) ||
        findProperty(schema, PROPERTY_ALIASES.status, ["select", "status"])
      );
    }
    if (kind === "planningProfile") {
      return Boolean(
        findProperty(schema, PROPERTY_ALIASES.profileId, ["rich_text"]) &&
        findProperty(schema, PROPERTY_ALIASES.configJson, ["rich_text"])
      );
    }
    if (kind === "dailyArchive") {
      return Boolean(
        findProperty(schema, PROPERTY_ALIASES.archiveId, ["rich_text"]) &&
        findProperty(schema, PROPERTY_ALIASES.date, ["date"])
      );
    }
    return [
      PROPERTY_ALIASES.dailySummary,
      PROPERTY_ALIASES.timeAnalysis,
      PROPERTY_ALIASES.problemAnalysis,
      PROPERTY_ALIASES.nextFocus,
    ].every((aliases) => findProperty(schema, aliases, ["rich_text"]));
  }

  function workspacePropertyRequirements(kind) {
    const definitions = WORKSPACE_DATABASES[kind].properties;
    const entry = (name, aliases, types) => ({ name, aliases, types, definition: definitions[name] });
    const requirements = {
      timeRecord: [
        entry("待办 ID", PROPERTY_ALIASES.todoId, ["rich_text"]),
        entry("待办链接", PROPERTY_ALIASES.todoUrl, ["url"]),
      ],
      weeklyPlan: [
        entry("计划 ID", PROPERTY_ALIASES.planId, ["rich_text"]),
        entry("开始日期", PROPERTY_ALIASES.weekStart, ["date"]),
        entry("结束日期", PROPERTY_ALIASES.weekEnd, ["date"]),
        entry("计划描述", PROPERTY_ALIASES.weeklyGoals, ["rich_text"]),
        entry("约束与说明", PROPERTY_ALIASES.constraints, ["rich_text"]),
        entry("每日里程碑 JSON", PROPERTY_ALIASES.milestonesJson, ["rich_text"]),
        entry("阶段调整记录", PROPERTY_ALIASES.phaseAdjustments, ["rich_text"]),
        entry("阶段总结", PROPERTY_ALIASES.phaseSummary, ["rich_text"]),
        entry("总结生成时间", PROPERTY_ALIASES.phaseSummaryAt, ["date"]),
        entry("状态", PROPERTY_ALIASES.status, ["select", "status"]),
      ],
      dailyPlan: [
        entry("待办 ID", PROPERTY_ALIASES.todoId, ["rich_text"]),
        entry("优先级", PROPERTY_ALIASES.priority, ["select"]),
        entry("说明", PROPERTY_ALIASES.details, ["rich_text"]),
        entry("来源", PROPERTY_ALIASES.source, ["rich_text"]),
        entry("预计番茄数", PROPERTY_ALIASES.estimatedPomodoros, ["number"]),
        entry("规划方式", PROPERTY_ALIASES.planningMode, ["select"]),
        entry("累计计划百分比", PROPERTY_ALIASES.targetProgressPercent, ["number"]),
        entry("阶段任务 ID", PROPERTY_ALIASES.phaseTaskId, ["rich_text"]),
        entry("投入依据", PROPERTY_ALIASES.effortBasis, ["select"]),
        entry("实际投入分钟", PROPERTY_ALIASES.actualMinutes, ["number"]),
        entry("实际番茄数", PROPERTY_ALIASES.actualPomodoros, ["number"]),
        entry("计划时间", PROPERTY_ALIASES.plannedTime, ["date"]),
        entry("Origin", PROPERTY_ALIASES.origin, ["select"]),
        entry("调整说明", PROPERTY_ALIASES.adjustmentNote, ["rich_text"]),
        entry("阶段计划 ID", PROPERTY_ALIASES.phasePlanLinkId, ["rich_text"]),
        entry("阶段计划名称", PROPERTY_ALIASES.phasePlanName, ["rich_text"]),
      ],
      planningProfile: [
        entry("Profile ID", PROPERTY_ALIASES.profileId, ["rich_text"]),
        entry("时区", PROPERTY_ALIASES.timezone, ["rich_text"]),
        entry("工作窗口摘要", PROPERTY_ALIASES.workWindowsSummary, ["rich_text"]),
        entry("固定安排摘要", PROPERTY_ALIASES.routineSummary, ["rich_text"]),
        entry("习惯说明", PROPERTY_ALIASES.preferenceNote, ["rich_text"]),
        entry("配置 JSON", PROPERTY_ALIASES.configJson, ["rich_text"]),
        entry("更新时间", PROPERTY_ALIASES.updatedAt, ["date"]),
      ],
      dailyReview: [
        entry("用户完成情况", PROPERTY_ALIASES.userCompletion, ["rich_text"]),
        entry("生活记录", PROPERTY_ALIASES.lifeRecord, ["rich_text"]),
        entry("阶段计划 ID", PROPERTY_ALIASES.phasePlanLinkId, ["rich_text"]),
        entry("阶段计划名称", PROPERTY_ALIASES.phasePlanName, ["rich_text"]),
      ],
      dailyArchive: [
        entry("归档 ID", PROPERTY_ALIASES.archiveId, ["rich_text"]),
        entry("日期", PROPERTY_ALIASES.date, ["date"]),
        entry("阶段计划 ID", PROPERTY_ALIASES.phasePlanLinkId, ["rich_text"]),
        entry("阶段计划名称", PROPERTY_ALIASES.phasePlanName, ["rich_text"]),
        entry("总投入分钟", PROPERTY_ALIASES.totalMinutes, ["number"]),
        entry("工作投入分钟", PROPERTY_ALIASES.workMinutes, ["number"]),
        entry("待办总数", PROPERTY_ALIASES.todoCount, ["number"]),
        entry("已完成待办数", PROPERTY_ALIASES.completedTodoCount, ["number"]),
        entry("番茄数", PROPERTY_ALIASES.pomodoroCount, ["number"]),
        entry("生成时间", PROPERTY_ALIASES.generatedAt, ["date"]),
        entry("文档版本", PROPERTY_ALIASES.documentVersion, ["rich_text"]),
      ],
    };
    return requirements[kind] || [];
  }

  async function ensureWorkspaceSchema(kind, source, config) {
    const additions = {};
    for (const requirement of workspacePropertyRequirements(kind)) {
      if (!findProperty(source.properties, requirement.aliases, requirement.types)) {
        if (kind === "dailyPlan" && ["规划方式", "累计计划百分比", "投入依据", "阶段任务 ID"].includes(requirement.name) && findProperty(source.properties, requirement.aliases)) {
          throw new Error(`已有 ${requirement.name} 字段类型不兼容，插件不会覆盖该字段。`);
        }
        if (kind === "dailyReview" && requirement.name === "生活记录" && findProperty(source.properties, requirement.aliases)) {
          throw new Error("已有生活记录字段不是 Rich text，请检查字段类型；插件不会覆盖该字段。");
        }
        additions[requirement.name] = requirement.definition;
      }
    }
    if (!Object.keys(additions).length) return { source, upgraded: false };
    await notionRequest(`/data_sources/${source.id}`, {
      method: "PATCH",
      body: JSON.stringify({ properties: additions }),
    }, config);
    return { source: await resolveDataSource(source.id, config), upgraded: true };
  }

  async function findWorkspaceDataSource(kind, parentPageId, configuredId, config, searchResults = []) {
    if (configuredId) {
      try {
        const configured = await resolveDataSource(configuredId, config);
        if (isWorkspaceCompatible(kind, configured) &&
            await belongsToParentPage(configured, parentPageId, config)) {
          return configured;
        }
      } catch (error) {
        if (error.status === 401 || error.status === 403) throw error;
      }
    }

    const definition = WORKSPACE_DATABASES[kind];
    const rankedCandidates = [...searchResults].sort((left, right) => {
      const leftTitle = notionTitle(left.title) || left.name || "";
      const rightTitle = notionTitle(right.title) || right.name || "";
      const score = (title) => definition.titleAliases.some((alias) =>
        normalizePropertyName(alias) === normalizePropertyName(title)
      ) ? 1 : 0;
      return score(rightTitle) - score(leftTitle);
    });
    for (const candidate of rankedCandidates) {
      const source = candidate.properties ? candidate : await resolveDataSource(candidate.id, config);
      if (!isWorkspaceCompatible(kind, source)) continue;
      if (await belongsToParentPage(source, parentPageId, config)) return source;
    }
    return null;
  }

  async function createWorkspaceDatabase(kind, parentPageId, config) {
    const definition = WORKSPACE_DATABASES[kind];
    const database = await notionRequest("/databases", {
      method: "POST",
      body: JSON.stringify({
        parent: { type: "page_id", page_id: normalizeNotionId(parentPageId) },
        title: richText(definition.title),
        is_inline: false,
        initial_data_source: { properties: definition.properties },
      }),
    }, config);
    const sourceId = database.data_sources?.[0]?.id || database.initial_data_source?.id;
    if (!sourceId) throw new Error(`已创建 ${definition.title}，但无法读取其数据源 ID。`);
    return resolveDataSource(sourceId, config);
  }

  async function loadDataSourceHistory(sourceId, config) {
    const pages = await queryDataSource(sourceId, { page_size: 100 }, config);
    const recent = [...pages]
      .sort((a, b) => String(b.last_edited_time || b.created_time || "")
        .localeCompare(String(a.last_edited_time || a.created_time || "")))
      .slice(0, 3)
      .map(pageToPlainObject);
    return { count: pages.length, recent };
  }

  async function initializeWorkspace(configInput, onProgress) {
    let config = configInput || await getConfig();
    requireToken(config);
    const parentPageId = normalizeNotionId(config.workspaceParentPageId);
    if (!parentPageId) throw new Error("请先填写 Notion 工作区父页面链接或页面 ID。");

    // Retrieving the page first gives a clear permission error before creation starts.
    await notionRequest(`/pages/${parentPageId}`, { method: "GET" }, config);
    const availableSources = await searchDataSources("", config);
    const results = {};
    const kinds = ["timeRecord", "weeklyPlan", "planningProfile", "dailyPlan", "dailyReview", "dailyArchive"];
    for (let index = 0; index < kinds.length; index += 1) {
      const kind = kinds[index];
      const configuredKey = `${kind}SourceId`;
      onProgress?.({ index, total: kinds.length, kind, phase: "checking" });
      let source = await findWorkspaceDataSource(
        kind,
        parentPageId,
        config[configuredKey],
        config,
        availableSources
      );
      let action = "loaded";
      if (!source) {
        onProgress?.({ index, total: kinds.length, kind, phase: "creating" });
        source = await createWorkspaceDatabase(kind, parentPageId, config);
        action = "created";
      } else {
        const ensured = await ensureWorkspaceSchema(kind, source, config);
        action = ensured.upgraded ? "upgraded" : "loaded";
        source = ensured.source;
      }
      const history = await loadDataSourceHistory(source.id, config);
      results[kind] = {
        id: source.id,
        name: notionTitle(source.title) || source.name || WORKSPACE_DATABASES[kind].title,
        action,
        historyCount: history.count,
        recent: history.recent,
        url: source.url || "",
      };
      config = { ...config, [configuredKey]: source.id };
      onProgress?.({ index: index + 1, total: kinds.length, kind, phase: "done", result: results[kind] });
    }

    config = await saveConfig(config);
    if (results.planningProfile?.historyCount === 0) {
      await savePlanningProfile(defaultPlanningProfile(), config, { allowEmpty: true });
      results.planningProfile.historyCount = 1;
      results.planningProfile.recent = [{ properties: { "配置名称": "默认个人节奏" } }];
    }
    return { config, databases: results };
  }

  function normalizePropertyName(value) {
    return String(value || "").toLowerCase().replace(/[\s_-]+/g, "");
  }

  function findProperty(schema, aliases, acceptedTypes = []) {
    const entries = Object.entries(schema || {});
    const aliasSet = new Set(aliases.map(normalizePropertyName));
    const matchesType = (property) => !acceptedTypes.length || acceptedTypes.includes(property.type);
    return entries.find(([name, property]) =>
      aliasSet.has(normalizePropertyName(name)) && matchesType(property)
    ) || null;
  }

  function findTitleProperty(schema) {
    return findProperty(schema, PROPERTY_ALIASES.title, ["title"]) ||
      Object.entries(schema || {}).find(([, property]) => property.type === "title") || null;
  }

  function richText(content) {
    const text = String(content || "").trim().slice(0, 2000);
    return text ? [{ type: "text", text: { content: text } }] : [];
  }

  function richTextLong(content, maxLength = 18000) {
    const text = String(content || "").trim().slice(0, maxLength);
    const chunks = [];
    for (let index = 0; index < text.length; index += 1800) {
      chunks.push({ type: "text", text: { content: text.slice(index, index + 1800) } });
    }
    return chunks;
  }

  function setProperty(target, match, value) {
    if (!match) return;
    target[match[0]] = value;
  }

  function getRecordTitle(record) {
    return String(record.content || record.title || defaultTypeTitle(record.type)).trim();
  }

  function defaultTypeTitle(type) {
    return ({ work: "工作", break: "休息", life: "生活", entertainment: "娱乐" })[type] || "时间记录";
  }

  function getEvaluation(record) {
    const parts = [];
    if (record.completion) parts.push(`完成度：${record.completion}`);
    if (record.focus) parts.push(`专注度：${record.focus}`);
    if (record.interruption) parts.push(`打断：${record.interruption}`);
    if (record.reviewNote) parts.push(record.reviewNote);
    return parts.join("；");
  }

  function getRecordNote(record) {
    const parts = [];
    if (record.note) parts.push(String(record.note));
    if (Array.isArray(record.interruptions) && record.interruptions.length) {
      const details = record.interruptions.map((item) => {
        const minutes = Math.max(0, Math.round(Number(item.durationMs || 0) / 60000));
        return `${item.reason || "短暂离开"}${minutes ? `（${minutes}分钟）` : ""}`;
      });
      parts.push(`打断记录：${details.join("；")}`);
    }
    return parts.join("\n");
  }

  function stableRecordId(record) {
    return String(record.id || `${record.dateKey || ""}:${record.start}:${record.type || "work"}`);
  }

  function recordFingerprint(record) {
    const source = JSON.stringify({
      start: Number(record.start),
      end: record.end == null ? null : Number(record.end),
      type: record.type,
      title: getRecordTitle(record),
      evaluation: getEvaluation(record),
      note: getRecordNote(record),
      todoId: record.todoId || "",
      todoUrl: record.todoUrl || "",
    });
    let hash = 2166136261;
    for (let index = 0; index < source.length; index += 1) {
      hash ^= source.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(16);
  }

  function buildTimeRecordProperties(record, schema) {
    const properties = {};
    const title = findTitleProperty(schema);
    if (!title) throw new Error("Time Record 数据源缺少标题属性。");
    setProperty(properties, title, { title: richText(getRecordTitle(record)) });

    const recordId = findProperty(schema, PROPERTY_ALIASES.recordId, ["rich_text"]);
    if (recordId) {
      setProperty(properties, recordId, {
        [recordId[1].type]: richText(stableRecordId(record)),
      });
    }

    const startIso = new Date(Number(record.start)).toISOString();
    const endIso = new Date(Number(record.end)).toISOString();
    const time = findProperty(schema, PROPERTY_ALIASES.time, ["date"]);
    const start = findProperty(schema, PROPERTY_ALIASES.start, ["date"]);
    const end = findProperty(schema, PROPERTY_ALIASES.end, ["date"]);
    if (!time && !start) {
      throw new Error("Time Record 数据源缺少“时间”或“开始时间”Date 属性。");
    }
    setProperty(properties, time, { date: { start: startIso, end: endIso } });
    setProperty(properties, start, { date: { start: startIso } });
    setProperty(properties, end, { date: { start: endIso } });

    const date = findProperty(schema, PROPERTY_ALIASES.date, ["date"]);
    if (date && date !== time && date !== start && date !== end) {
      setProperty(properties, date, { date: { start: record.dateKey || startIso.slice(0, 10) } });
    }

    const type = findProperty(schema, PROPERTY_ALIASES.type, ["select", "rich_text"]);
    if (type) {
      setProperty(properties, type, type[1].type === "select"
        ? { select: { name: record.type || "work" } }
        : { rich_text: richText(record.type || "work") });
    }

    const duration = findProperty(schema, PROPERTY_ALIASES.duration, ["number"]);
    setProperty(properties, duration, {
      number: Math.max(0, Math.round((Number(record.end) - Number(record.start)) / 60000 * 10) / 10),
    });

    const evaluation = findProperty(schema, PROPERTY_ALIASES.evaluation, ["rich_text"]);
    setProperty(properties, evaluation, { rich_text: richText(getEvaluation(record)) });
    const note = findProperty(schema, PROPERTY_ALIASES.note, ["rich_text"]);
    setProperty(properties, note, { rich_text: richText(getRecordNote(record)) });
    const todoId = findProperty(schema, PROPERTY_ALIASES.todoId, ["rich_text"]);
    setProperty(properties, todoId, { rich_text: richText(record.todoId || "") });
    const todoUrl = findProperty(schema, PROPERTY_ALIASES.todoUrl, ["url"]);
    setProperty(properties, todoUrl, { url: record.todoUrl || null });
    return properties;
  }

  async function queryDataSource(dataSourceId, body, config) {
    const results = [];
    let startCursor;
    do {
      const response = await notionRequest(
        `/data_sources/${dataSourceId}/query`,
        {
          method: "POST",
          body: JSON.stringify({ ...body, ...(startCursor ? { start_cursor: startCursor } : {}) }),
        },
        config
      );
      results.push(...(response.results || []));
      startCursor = response.has_more ? response.next_cursor : null;
    } while (startCursor);
    return results;
  }

  async function findPageByExternalId(dataSourceId, property, recordId, config) {
    if (!property || !["rich_text", "title"].includes(property[1].type)) return null;
    const condition = property[1].type === "title"
      ? { title: { equals: recordId } }
      : { rich_text: { equals: recordId } };
    const pages = await queryDataSource(dataSourceId, {
      page_size: 100,
      filter: { property: property[0], ...condition },
    }, config);
    return pages.sort((left, right) =>
      String(right.last_edited_time || right.created_time || "")
        .localeCompare(String(left.last_edited_time || left.created_time || ""))
    )[0] || null;
  }

  async function upsertTimeRecord(record, source, config, syncMap) {
    const recordId = stableRecordId(record);
    const fingerprint = recordFingerprint(record);
    const previous = syncMap[recordId];
    if (previous?.fingerprint === fingerprint && previous?.pageId) {
      return { action: "unchanged", pageId: previous.pageId, fingerprint };
    }

    const properties = buildTimeRecordProperties(record, source.properties);
    const recordIdProperty = findProperty(
      source.properties,
      PROPERTY_ALIASES.recordId,
      ["rich_text"]
    );
    let pageId = previous?.pageId || "";

    if (!pageId) {
      const existing = await findPageByExternalId(source.id, recordIdProperty, recordId, config);
      pageId = existing?.id || "";
    }

    if (pageId) {
      try {
        await notionRequest(`/pages/${pageId}`, {
          method: "PATCH",
          body: JSON.stringify({ properties }),
        }, config);
        return { action: "updated", pageId, fingerprint };
      } catch (error) {
        if (error.status !== 404 && !isTrashedObjectError(error)) throw error;
        pageId = "";
      }
    }

    const page = await notionRequest("/pages", {
      method: "POST",
      body: JSON.stringify({
        parent: { type: "data_source_id", data_source_id: source.id },
        properties,
      }),
    }, config);
    return { action: "created", pageId: page.id, fingerprint };
  }

  async function syncDailyTodoProgress(config) {
    if (!config.dailyPlanSourceId) return { updated: 0 };
    const source = await resolveDataSource(config.dailyPlanSourceId, config);
    const minutesProperty = findProperty(source.properties, PROPERTY_ALIASES.actualMinutes, ["number"]);
    const countProperty = findProperty(source.properties, PROPERTY_ALIASES.actualPomodoros, ["number"]);
    if (!minutesProperty && !countProperty) return { updated: 0 };
    const groups = new Map();
    for (const record of await loadAllLocalRecords()) {
      if (!record?.todoId || record.type !== "work" || !Number.isFinite(Number(record.end))) continue;
      const current = groups.get(record.todoId) || { minutes: 0, count: 0 };
      current.minutes += Math.max(0, Number(record.end) - Number(record.start)) / 60000;
      current.count += 1;
      groups.set(record.todoId, current);
    }
    const pageGroups = new Map();
    for (const [todoId, totals] of groups) {
      const pageId = isNotionPageId(todoId)
        ? normalizeNotionId(todoId)
        : normalizeNotionId((await findDailyTodoPageByExternalId(todoId, config))?.id || "");
      if (!pageId) continue;
      const current = pageGroups.get(pageId) || { minutes: 0, count: 0 };
      current.minutes += totals.minutes;
      current.count += totals.count;
      pageGroups.set(pageId, current);
    }
    let updated = 0;
    for (const [pageId, totals] of pageGroups) {
      const properties = {};
      setProperty(properties, minutesProperty, { number: Math.round(totals.minutes * 10) / 10 });
      setProperty(properties, countProperty, { number: totals.count });
      try {
        await notionRequest(`/pages/${pageId}`, {
          method: "PATCH",
          body: JSON.stringify({ properties }),
        }, config);
        updated += 1;
      } catch (error) {
        if (error.status !== 404 && !isTrashedObjectError(error)) throw error;
      }
      await wait(340);
    }
    return { updated };
  }

  function extractTimelineRecords(storage) {
    const result = [];
    for (const [key, value] of Object.entries(storage || {})) {
      if (!key.startsWith(TIMELINE_PREFIX) || !Array.isArray(value)) continue;
      const dateKey = key.slice(TIMELINE_PREFIX.length);
      for (const record of value) {
        if (!record || !Number.isFinite(Number(record.start))) continue;
        result.push({ ...record, dateKey });
      }
    }
    return result.sort((a, b) => Number(a.start) - Number(b.start));
  }

  async function loadAllLocalRecords() {
    return extractTimelineRecords(await storageGet(null));
  }

  async function syncRecords(inputRecords, options = {}) {
    const config = options.config || await getConfig();
    requireToken(config);
    if (!config.timeRecordSourceId) throw new Error("请先绑定 Time Record 数据源。");
    const source = await resolveDataSource(config.timeRecordSourceId, config);
    const mapResult = await storageGet(SYNC_MAP_KEY);
    const allSyncMaps = { ...(mapResult[SYNC_MAP_KEY] || {}) };
    const syncMap = { ...(allSyncMaps[source.id] || {}) };
    const deletionResult = await storageGet(DELETED_RECORDS_KEY);
    const deletionMap = { ...(deletionResult[DELETED_RECORDS_KEY] || {}) };
    const deletedIds = new Set(Object.keys(deletionMap));
    const records = (inputRecords || []).filter((record) =>
      record && Number.isFinite(Number(record.start)) &&
      Number.isFinite(Number(record.end)) && Number(record.end) >= Number(record.start) &&
      !record.autoFilled && !deletedIds.has(stableRecordId(record))
    );
    const summary = { total: records.length, created: 0, updated: 0, unchanged: 0, deleted: 0, failed: 0, errors: [] };

    for (const recordId of deletedIds) {
      let pageId = syncMap[recordId]?.pageId || deletionMap[recordId]?.pageId;
      if (!pageId) {
        const recordIdProperty = findProperty(source.properties, PROPERTY_ALIASES.recordId, ["rich_text"]);
        const existing = await findPageByExternalId(source.id, recordIdProperty, recordId, config);
        pageId = existing?.id || "";
      }
      if (!pageId) {
        delete deletionMap[recordId];
        delete syncMap[recordId];
        continue;
      }
      try {
        await notionRequest(`/pages/${normalizeNotionId(pageId)}`, {
          method: "PATCH", body: JSON.stringify({ in_trash: true }),
        }, config);
        summary.deleted += 1;
        delete deletionMap[recordId];
        delete syncMap[recordId];
      } catch (error) {
        if (error.status === 404 || isTrashedObjectError(error)) {
          delete deletionMap[recordId];
          delete syncMap[recordId];
        } else {
          summary.failed += 1;
          summary.errors.push({ id: recordId, message: error.message });
        }
      }
      await wait(340);
    }

    for (let index = 0; index < records.length; index += 1) {
      const record = records[index];
      try {
        const result = await upsertTimeRecord(record, source, config, syncMap);
        summary[result.action] += 1;
        syncMap[stableRecordId(record)] = {
          pageId: result.pageId,
          fingerprint: result.fingerprint,
          syncedAt: new Date().toISOString(),
        };
      } catch (error) {
        summary.failed += 1;
        summary.errors.push({ id: stableRecordId(record), message: error.message });
      }
      options.onProgress?.({ index: index + 1, total: records.length, summary });
      if (index < records.length - 1) await wait(340);
    }

    const state = {
      lastSyncAt: new Date().toISOString(),
      lastSyncSummary: summary,
      resolvedTimeRecordSourceId: source.id,
    };
    allSyncMaps[source.id] = syncMap;
    const todoProgress = await syncDailyTodoProgress(config);
    summary.todoProgressUpdated = todoProgress.updated;
    await storageSet({ [SYNC_MAP_KEY]: allSyncMaps, [SYNC_STATE_KEY]: state, [DELETED_RECORDS_KEY]: deletionMap });
    return summary;
  }

  async function syncAllLocalRecords(options = {}) {
    return syncRecords(await loadAllLocalRecords(), options);
  }

  async function syncDateRange(startKey, endKey, options = {}) {
    const records = (await loadAllLocalRecords()).filter((record) =>
      record.dateKey >= startKey && record.dateKey <= endKey
    );
    return syncRecords(records, options);
  }

  async function pullTimeRecordsFromNotion(configInput) {
    const config = configInput || await getConfig();
    requireToken(config);
    if (!config.timeRecordSourceId) return { pulled: 0, updated: 0 };
    const source = await resolveDataSource(config.timeRecordSourceId, config);
    const pages = await queryDataSource(source.id, { page_size: 100 }, config);
    const localStorage = await storageGet(null);
    const syncMaps = localStorage[SYNC_MAP_KEY] || {};
    const sourceSyncMap = { ...(syncMaps[source.id] || {}) };
    const originalSourceSyncMap = { ...sourceSyncMap };
    const deletionResult = localStorage[DELETED_RECORDS_KEY] || {};
    const deletedIds = new Set(Object.keys(deletionResult));
    const localRecords = extractTimelineRecords(localStorage);
    const localById = new Map(localRecords.map((record) => [stableRecordId(record), record]));
    const remoteRecordIds = new Set();
    const touchedDates = new Set();
    let updated = 0;
    let deleted = 0;

    for (const page of pages) {
      const recordId = String(pagePropertyValue(page, PROPERTY_ALIASES.recordId, ["rich_text", "title"]) || "").trim();
      if (!recordId || deletedIds.has(recordId)) continue;
      remoteRecordIds.add(recordId);
      const range = pagePropertyDateRange(page, PROPERTY_ALIASES.time) || {
        start: pagePropertyValue(page, PROPERTY_ALIASES.start, ["date"]),
        end: pagePropertyValue(page, PROPERTY_ALIASES.end, ["date"]),
      };
      const start = Date.parse(range?.start || "");
      const end = Date.parse(range?.end || "");
      if (!Number.isFinite(start) || !Number.isFinite(end)) continue;
      const dateKey = String(pagePropertyValue(page, PROPERTY_ALIASES.date, ["date"]) || "").slice(0, 10) ||
        new Date(start).toLocaleDateString("sv-SE");
      const existing = localById.get(recordId) || {};
      const lastSyncedFingerprint = sourceSyncMap[recordId]?.fingerprint;
      const locallyChanged = existing.id && lastSyncedFingerprint && recordFingerprint(existing) !== lastSyncedFingerprint;
      if (locallyChanged) continue;
      const incoming = {
        ...existing,
        id: recordId,
        dateKey,
        start,
        end,
        type: String(pagePropertyValue(page, PROPERTY_ALIASES.type, ["select", "rich_text"]) || existing.type || "work"),
        content: String(pagePropertyValue(page, PROPERTY_ALIASES.title, ["title"]) || existing.content || "工作"),
        note: String(pagePropertyValue(page, PROPERTY_ALIASES.note, ["rich_text"]) || ""),
        todoId: String(pagePropertyValue(page, PROPERTY_ALIASES.todoId, ["rich_text"]) || existing.todoId || ""),
        todoUrl: String(pagePropertyValue(page, PROPERTY_ALIASES.todoUrl, ["url"]) || existing.todoUrl || ""),
      };
      if (JSON.stringify(existing) !== JSON.stringify(incoming)) updated += 1;
      localById.set(recordId, incoming);
      touchedDates.add(dateKey);
      if (existing.dateKey && existing.dateKey !== dateKey) touchedDates.add(existing.dateKey);
    }

    // A data-source query omits pages in the Notion trash. Confirm the page
    // state before removing the matching local record; a missing permission or
    // transient 404 is never treated as a deletion.
    for (const [recordId, syncEntry] of Object.entries(sourceSyncMap)) {
      if (remoteRecordIds.has(recordId) || !localById.has(recordId) || !syncEntry?.pageId) continue;
      try {
        const page = await notionRequest(`/pages/${normalizeNotionId(syncEntry.pageId)}`, { method: "GET" }, config);
        if (!page.in_trash && !page.archived) continue;
        const local = localById.get(recordId);
        if (local?.dateKey) touchedDates.add(local.dateKey);
        localById.delete(recordId);
        delete sourceSyncMap[recordId];
        deleted += 1;
      } catch (error) {
        if (error.status !== 404) throw error;
      }
      await wait(160);
    }

    // Notion reads can take several seconds. Re-read local state immediately
    // before committing and preserve any record the user created, edited,
    // moved or deleted after the initial snapshot.
    const latestLocalStorage = await storageGet(null);
    const latestLocalRecords = extractTimelineRecords(latestLocalStorage);
    const originalById = new Map(localRecords.map((record) => [stableRecordId(record), record]));
    const latestById = new Map(latestLocalRecords.map((record) => [stableRecordId(record), record]));
    for (const [recordId, original] of originalById) {
      const latest = latestById.get(recordId);
      if (!latest) {
        localById.delete(recordId);
        if (original.dateKey) touchedDates.add(original.dateKey);
        continue;
      }
      if (JSON.stringify(latest) !== JSON.stringify(original)) {
        localById.set(recordId, latest);
        if (original.dateKey) touchedDates.add(original.dateKey);
        if (latest.dateKey) touchedDates.add(latest.dateKey);
      }
    }
    for (const [recordId, latest] of latestById) {
      if (!originalById.has(recordId)) {
        localById.set(recordId, latest);
        if (latest.dateKey) touchedDates.add(latest.dateKey);
      }
    }

    const payload = {};
    for (const dateKey of touchedDates) {
      payload[`${TIMELINE_PREFIX}${dateKey}`] = [...localById.values()]
        .filter((record) => record.dateKey === dateKey)
        .sort((a, b) => Number(a.start) - Number(b.start));
    }
    const latestSyncMaps = latestLocalStorage[SYNC_MAP_KEY] || {};
    const mergedSourceSyncMap = { ...sourceSyncMap };
    for (const [recordId, entry] of Object.entries(latestSyncMaps[source.id] || {})) {
      if (!Object.prototype.hasOwnProperty.call(originalSourceSyncMap, recordId) ||
          JSON.stringify(entry) !== JSON.stringify(originalSourceSyncMap[recordId])) {
        mergedSourceSyncMap[recordId] = entry;
      }
    }
    syncMaps[source.id] = mergedSourceSyncMap;
    if (Object.keys(payload).length || deleted) await storageSet({ ...payload, [SYNC_MAP_KEY]: syncMaps });
    return { pulled: pages.length, updated, deleted };
  }

  function extractPlainProperty(property) {
    if (!property) return "";
    if (property.type === "title") return (property.title || []).map((item) => item.plain_text || "").join("");
    if (property.type === "rich_text") return (property.rich_text || []).map((item) => item.plain_text || "").join("");
    if (property.type === "select") return property.select?.name || "";
    if (property.type === "status") return property.status?.name || "";
    if (property.type === "checkbox") return Boolean(property.checkbox);
    if (property.type === "number") return property.number;
    if (property.type === "date") return property.date?.start || "";
    if (property.type === "url") return property.url || "";
    return "";
  }

  function pageToPlainObject(page) {
    const plain = {
      id: page.id,
      url: page.url,
      lastEditedTime: page.last_edited_time || "",
      properties: {},
      propertyTypes: {},
      dateRanges: {},
    };
    for (const [name, property] of Object.entries(page.properties || {})) {
      plain.properties[name] = extractPlainProperty(property);
      plain.propertyTypes[name] = property.type || "";
      if (property.type === "date" && property.date) plain.dateRanges[name] = property.date;
    }
    return plain;
  }

  function pagePropertyValue(page, aliases, acceptedTypes = []) {
    const match = findProperty(page?.properties || {}, aliases, acceptedTypes);
    return match ? extractPlainProperty(match[1]) : "";
  }

  function pagePropertyDateRange(page, aliases) {
    const match = findProperty(page?.properties || {}, aliases, ["date"]);
    return match?.[1]?.date || null;
  }

  function parseJson(value, fallback) {
    try {
      return JSON.parse(String(value || ""));
    } catch {
      return fallback;
    }
  }

  function addDaysToDateKey(dateKey, days) {
    const date = new Date(`${dateKey}T12:00:00`);
    date.setDate(date.getDate() + days);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }

  async function loadDailyPlan(dateKey, configInput) {
    const config = configInput || await getConfig();
    if (!config.dailyPlanSourceId) return [];
    const source = await resolveDataSource(config.dailyPlanSourceId, config);
    const dateProperty = findProperty(source.properties, PROPERTY_ALIASES.date, ["date"]);
    if (!dateProperty) throw new Error("Daily Todo 数据源缺少“日期”Date 属性。");
    const pages = await queryDataSource(source.id, {
      page_size: 100,
      filter: { property: dateProperty[0], date: { equals: dateKey } },
    }, config);
    return pages.map(pageToPlainObject);
  }

  async function loadDailyTodos(dateKey, configInput) {
    const config = configInput || await getConfig();
    const pages = await loadDailyPlan(dateKey, config);
    let todos = pages.map((plain) => {
      const entries = Object.entries(plain.properties || {});
      const titleEntry = entries.find(([name]) => plain.propertyTypes?.[name] === "title") ||
        entries.find(([name]) => /^(待办|标题|任务|名称|todo|title|task|name)$/i.test(name.trim()));
      const valueByAliases = (aliases) => {
        const entry = entries.find(([name]) => aliases.some((alias) =>
          normalizePropertyName(alias) === normalizePropertyName(name)
        ));
        return entry?.[1] ?? "";
      };
      const completedValue = valueByAliases(PROPERTY_ALIASES.completed);
      const plannedTimeEntry = Object.entries(plain.dateRanges || {}).find(([name]) =>
        PROPERTY_ALIASES.plannedTime.some((alias) => normalizePropertyName(alias) === normalizePropertyName(name))
      );
      const plannedTime = plannedTimeEntry?.[1] || null;
      return {
        id: plain.id,
        url: plain.url,
        lastEditedTime: plain.lastEditedTime || "",
        title: String(titleEntry?.[1] || "未命名待办"),
        date: dateKey,
        status: String(valueByAliases(PROPERTY_ALIASES.status) || (completedValue ? "done" : "pending")),
        priority: String(valueByAliases(PROPERTY_ALIASES.priority) || "medium"),
        details: String(valueByAliases(PROPERTY_ALIASES.details) || ""),
        source: String(valueByAliases(PROPERTY_ALIASES.source) || ""),
        planningMode: String(valueByAliases(PROPERTY_ALIASES.planningMode) || "explicit"),
        phaseTaskId: String(valueByAliases(PROPERTY_ALIASES.phaseTaskId) || "") || null,
        targetProgressPercent: valueByAliases(PROPERTY_ALIASES.targetProgressPercent) === "" || valueByAliases(PROPERTY_ALIASES.targetProgressPercent) == null ? null : Number(valueByAliases(PROPERTY_ALIASES.targetProgressPercent)),
        effortBasis: String(valueByAliases(PROPERTY_ALIASES.effortBasis) || "task_estimate"),
        estimatedPomodoros: valueByAliases(PROPERTY_ALIASES.effortBasis) === "unknown" ? null : Number(valueByAliases(PROPERTY_ALIASES.estimatedPomodoros) || 0),
        actualMinutes: Number(valueByAliases(PROPERTY_ALIASES.actualMinutes) || 0),
        actualPomodoros: Number(valueByAliases(PROPERTY_ALIASES.actualPomodoros) || 0),
        plannedStart: plannedTime?.start || (valueByAliases(PROPERTY_ALIASES.effortBasis) === "unknown" ? null : ""),
        plannedEnd: plannedTime?.end || (valueByAliases(PROPERTY_ALIASES.effortBasis) === "unknown" ? null : ""),
        // Legacy rows have no Origin. Treat them as user-owned so an LLM
        // adjustment can never archive historical tasks by accident.
        origin: String(valueByAliases(PROPERTY_ALIASES.origin) || "user"),
        adjustmentNote: String(valueByAliases(PROPERTY_ALIASES.adjustmentNote) || ""),
        phasePlanId: String(valueByAliases(PROPERTY_ALIASES.phasePlanLinkId) || ""),
        phasePlanName: String(valueByAliases(PROPERTY_ALIASES.phasePlanName) || ""),
        externalId: String(valueByAliases(PROPERTY_ALIASES.todoId) || plain.id),
      };
    });
    const queued = (await getQueuedWrites()).filter((item) => item.payload?.dateKey === dateKey && ["todo_upsert", "todo_delete"].includes(item.kind));
    for (const operation of queued) {
      const payloadTodo = operation.payload?.todo;
      const externalId = String(payloadTodo?.externalId || payloadTodo?.id || operation.payload?.externalId || "");
      const index = todos.findIndex((item) =>
        item.id === payloadTodo?.id || item.externalId === externalId || item.id === operation.payload?.pageId
      );
      if (operation.kind === "todo_delete") {
        if (index >= 0) todos.splice(index, 1);
        continue;
      }
      const localTodo = { ...payloadTodo, date: dateKey, pendingSync: true };
      if (index >= 0) todos[index] = { ...todos[index], ...localTodo, id: todos[index].id || localTodo.id };
      else todos.push(localTodo);
    }
    return todos.sort((left, right) => {
      const leftStart = String(left.plannedStart || "");
      const rightStart = String(right.plannedStart || "");
      if (leftStart && rightStart && leftStart !== rightStart) return leftStart.localeCompare(rightStart);
      if (leftStart && !rightStart) return -1;
      if (!leftStart && rightStart) return 1;
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      const priorityDifference = (priorityOrder[left.priority] ?? 3) - (priorityOrder[right.priority] ?? 3);
      return priorityDifference || left.title.localeCompare(right.title, "zh-CN");
    });
  }

  async function loadWeeklyPlan(dateKey, configInput) {
    const config = configInput || await getConfig();
    if (!config.weeklyPlanSourceId) return null;
    const source = await resolveDataSource(config.weeklyPlanSourceId, config);
    const weekStart = findProperty(source.properties, PROPERTY_ALIASES.weekStart, ["date"]);
    if (!weekStart) throw new Error("Phase Plan 数据源缺少“开始日期”Date 属性。");
    const pages = await queryDataSource(source.id, {
      page_size: 100,
      filter: { property: weekStart[0], date: { on_or_before: dateKey } },
      sorts: [{ property: weekStart[0], direction: "descending" }],
    }, config);
    for (const page of pages) {
      const start = String(pagePropertyValue(page, PROPERTY_ALIASES.weekStart, ["date"]) || "").slice(0, 10);
      const explicitEnd = String(pagePropertyValue(page, PROPERTY_ALIASES.weekEnd, ["date"]) || "").slice(0, 10);
      // Old Weekly Plan rows did not have an end date. Keep the seven-day fallback
      // only for those legacy rows; every new Phase Plan writes an explicit end.
      const end = explicitEnd || addDaysToDateKey(start, 6);
      if (start && start <= dateKey && dateKey <= end) {
        const milestones = parseJson(
          pagePropertyValue(page, PROPERTY_ALIASES.milestonesJson, ["rich_text"]),
          []
        );
        const description = String(pagePropertyValue(page, PROPERTY_ALIASES.weeklyGoals, ["rich_text"]) || "");
        return {
          ...pageToPlainObject(page),
          title: pagePropertyValue(page, PROPERTY_ALIASES.title, ["title"]) || notionTitle(page.properties?.[findTitleProperty(page.properties)?.[0]]?.title),
          planId: String(pagePropertyValue(page, PROPERTY_ALIASES.planId, ["rich_text"]) || page.id),
          startDate: start,
          endDate: end,
          description,
          milestones: Array.isArray(milestones) ? milestones : [],
          weekStart: start,
          weekEnd: end,
          goals: description,
          constraints: String(pagePropertyValue(page, PROPERTY_ALIASES.constraints, ["rich_text"]) || ""),
          status: String(pagePropertyValue(page, PROPERTY_ALIASES.status, ["select", "status"]) || "active"),
          adjustments: parseJson(pagePropertyValue(page, PROPERTY_ALIASES.phaseAdjustments, ["rich_text"]), []),
          finalSummary: String(pagePropertyValue(page, PROPERTY_ALIASES.phaseSummary, ["rich_text"]) || ""),
          summaryGeneratedAt: String(pagePropertyValue(page, PROPERTY_ALIASES.phaseSummaryAt, ["date"]) || ""),
        };
      }
    }
    return null;
  }

  const loadPhasePlan = loadWeeklyPlan;

  async function loadPhasePlansInRange(startKey, endKey, configInput) {
    const config = configInput || await getConfig();
    if (!config.weeklyPlanSourceId) return [];
    const source = await resolveDataSource(config.weeklyPlanSourceId, config);
    const startProperty = findProperty(source.properties, PROPERTY_ALIASES.weekStart, ["date"]);
    if (!startProperty) throw new Error("Phase Plan 数据源缺少“开始日期”Date 属性。");
    const pages = await queryDataSource(source.id, {
      page_size: 100,
      filter: { property: startProperty[0], date: { on_or_before: endKey } },
      sorts: [{ property: startProperty[0], direction: "ascending" }],
    }, config);
    return pages.map(parsePhasePlanPage).filter((plan) => plan.startDate <= endKey && plan.endDate >= startKey);
  }

  async function loadAllPhasePlans(configInput) {
    const plans = await loadPhasePlansInRange("1900-01-01", "2999-12-31", configInput);
    return plans.sort((left, right) =>
      String(right.startDate || "").localeCompare(String(left.startDate || "")) ||
      String(right.endDate || "").localeCompare(String(left.endDate || ""))
    );
  }

  function parsePhasePlanPage(page) {
    const start = String(pagePropertyValue(page, PROPERTY_ALIASES.weekStart, ["date"]) || "").slice(0, 10);
    const end = String(pagePropertyValue(page, PROPERTY_ALIASES.weekEnd, ["date"]) || "").slice(0, 10) || addDaysToDateKey(start, 6);
    return {
      ...pageToPlainObject(page),
      title: pagePropertyValue(page, PROPERTY_ALIASES.title, ["title"]) || notionTitle(page.properties?.[findTitleProperty(page.properties)?.[0]]?.title) || "阶段计划",
      planId: String(pagePropertyValue(page, PROPERTY_ALIASES.planId, ["rich_text"]) || page.id),
      startDate: start,
      endDate: end,
      description: String(pagePropertyValue(page, PROPERTY_ALIASES.weeklyGoals, ["rich_text"]) || ""),
      milestones: parseJson(pagePropertyValue(page, PROPERTY_ALIASES.milestonesJson, ["rich_text"]), []),
      adjustments: parseJson(pagePropertyValue(page, PROPERTY_ALIASES.phaseAdjustments, ["rich_text"]), []),
      constraints: String(pagePropertyValue(page, PROPERTY_ALIASES.constraints, ["rich_text"]) || ""),
      status: String(pagePropertyValue(page, PROPERTY_ALIASES.status, ["select", "status"]) || "active"),
      finalSummary: String(pagePropertyValue(page, PROPERTY_ALIASES.phaseSummary, ["rich_text"]) || ""),
      summaryGeneratedAt: String(pagePropertyValue(page, PROPERTY_ALIASES.phaseSummaryAt, ["date"]) || ""),
    };
  }

  function phasePlanId(plan) {
    return String(plan?.planId || `phase:${plan?.startDate || "unknown"}:${Date.now().toString(36)}`);
  }

  function buildPhasePlanProperties(plan, schema) {
    const startDate = String(plan.startDate || "").slice(0, 10);
    const durationDays = Math.max(1, Math.min(366, Math.round(Number(plan.durationDays) || 1)));
    const endDate = String(plan.endDate || "").slice(0, 10) || addDaysToDateKey(startDate, durationDays - 1);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate) || endDate < startDate) {
      throw new Error("阶段计划的开始和结束日期无效。");
    }
    const milestoneJson = JSON.stringify(Array.isArray(plan.milestones) ? plan.milestones : []);
    const adjustmentJson = JSON.stringify(Array.isArray(plan.adjustments) ? plan.adjustments : []);
    if (milestoneJson.length > 18000 || adjustmentJson.length > 18000) {
      throw new Error("阶段计划结构数据超过当前保存上限，请缩短阶段范围或减少单日事项；本次未截断JSON、未写入Notion。");
    }
    const properties = {};
    const stablePlanId = phasePlanId(plan);
    setProperty(properties, findTitleProperty(schema), { title: richText(plan.title || `${startDate} 阶段计划`) });
    setProperty(properties, findProperty(schema, PROPERTY_ALIASES.planId, ["rich_text"]), { rich_text: richText(stablePlanId) });
    setProperty(properties, findProperty(schema, PROPERTY_ALIASES.weekStart, ["date"]), { date: { start: startDate } });
    setProperty(properties, findProperty(schema, PROPERTY_ALIASES.weekEnd, ["date"]), { date: { start: endDate } });
    setProperty(properties, findProperty(schema, PROPERTY_ALIASES.weeklyGoals, ["rich_text"]), { rich_text: richTextLong(plan.description || plan.goals) });
    setProperty(properties, findProperty(schema, PROPERTY_ALIASES.constraints, ["rich_text"]), { rich_text: richTextLong(plan.constraints) });
    setProperty(properties, findProperty(schema, PROPERTY_ALIASES.milestonesJson, ["rich_text"]), {
      rich_text: richTextLong(milestoneJson),
    });
    setProperty(properties, findProperty(schema, PROPERTY_ALIASES.phaseAdjustments, ["rich_text"]), {
      rich_text: richTextLong(adjustmentJson),
    });
    setProperty(properties, findProperty(schema, PROPERTY_ALIASES.phaseSummary, ["rich_text"]), { rich_text: richTextLong(plan.finalSummary) });
    setProperty(properties, findProperty(schema, PROPERTY_ALIASES.phaseSummaryAt, ["date"]), {
      date: plan.summaryGeneratedAt ? { start: plan.summaryGeneratedAt } : null,
    });
    const status = findProperty(schema, PROPERTY_ALIASES.status, ["select", "status"]);
    setProperty(properties, status, status?.[1]?.type === "status"
      ? { status: { name: plan.status || "active" } }
      : { select: { name: plan.status || "active" } });
    return { properties, startDate, endDate, planId: stablePlanId };
  }

  async function savePhasePlan(plan, configInput) {
    const config = configInput || await getConfig();
    if (!config.weeklyPlanSourceId) throw new Error("请先绑定 Phase Plan 数据源。");
    if (plan?.id && !Object.prototype.hasOwnProperty.call(plan, "milestones")) {
      const existingPage = await notionRequest(`/pages/${normalizeNotionId(plan.id)}`, { method: "GET" }, config);
      const existingPlan = parsePhasePlanPage(existingPage);
      plan = { ...existingPlan, ...plan };
    }
    if (!String(plan?.description || plan?.goals || "").trim()) throw new Error("请填写阶段计划描述。");
    const source = await resolveDataSource(config.weeklyPlanSourceId, config);
    const built = buildPhasePlanProperties(plan, source.properties);
    const idProperty = findProperty(source.properties, PROPERTY_ALIASES.planId, ["rich_text"]);
    const startProperty = findProperty(source.properties, PROPERTY_ALIASES.weekStart, ["date"]);
    if (startProperty) {
      const possibleOverlaps = await queryDataSource(source.id, {
        page_size: 100,
        filter: { property: startProperty[0], date: { on_or_before: built.endDate } },
      }, config);
      const conflict = possibleOverlaps.map(parsePhasePlanPage).find((item) =>
        item.endDate >= built.startDate && item.startDate <= built.endDate &&
        item.id !== plan?.id && item.planId !== built.planId
      );
      if (conflict) {
        throw new Error(`阶段计划与“${conflict.title}”（${conflict.startDate} 至 ${conflict.endDate}）时间重叠，请先调整日期范围。`);
      }
    }
    const existing = plan?.id
      ? { id: normalizeNotionId(plan.id) }
      : await findPageByExternalId(source.id, idProperty, built.planId, config);
    if (existing) {
      const page = await notionRequest(`/pages/${existing.id}`, {
        method: "PATCH", body: JSON.stringify({ properties: built.properties }),
      }, config);
      return { ...built, id: page.id, url: page.url, action: "updated" };
    }
    const page = await notionRequest("/pages", {
      method: "POST",
      body: JSON.stringify({ parent: { type: "data_source_id", data_source_id: source.id }, properties: built.properties }),
    }, config);
    return { ...built, id: page.id, url: page.url, action: "created" };
  }

  async function updatePhasePlanMetadata(planInput, updates, configInput) {
    const config = configInput || await getConfig();
    if (!planInput?.id) throw new Error("阶段计划无效。");
    const previousStartDate = planInput.startDate;
    const previousEndDate = planInput.endDate;
    const updated = {
      ...planInput,
      ...updates,
      id: planInput.id,
      planId: planInput.planId,
      milestones: Array.isArray(planInput.milestones) ? planInput.milestones : [],
      adjustments: Array.isArray(planInput.adjustments) ? planInput.adjustments : [],
    };
    const saved = await savePhasePlan(updated, config);
    const finalPlan = { ...updated, ...saved };
    await syncPhasePlanBindings(finalPlan, previousEndDate, config, previousStartDate);
    return finalPlan;
  }

  async function clearPhasePlanBindings(plan, configInput) {
    const config = configInput || await getConfig();
    const clearSource = async (sourceId) => {
      if (!sourceId) return;
      const source = await resolveDataSource(sourceId, config);
      const dateProperty = findProperty(source.properties, PROPERTY_ALIASES.date, ["date"]);
      const planIdProperty = findProperty(source.properties, PROPERTY_ALIASES.phasePlanLinkId, ["rich_text"]);
      const planNameProperty = findProperty(source.properties, PROPERTY_ALIASES.phasePlanName, ["rich_text"]);
      if (!dateProperty || (!planIdProperty && !planNameProperty)) return;
      const pages = planIdProperty
        ? await queryDataSource(source.id, {
            page_size: 100,
            filter: { property: planIdProperty[0], rich_text: { equals: plan.planId } },
          }, config)
        : await queryDataSource(source.id, {
            page_size: 100,
            filter: { and: [
              { property: dateProperty[0], date: { on_or_after: plan.startDate } },
              { property: dateProperty[0], date: { on_or_before: plan.endDate } },
            ] },
          }, config);
      for (const page of pages) {
        const currentPlanId = String(pagePropertyValue(page, PROPERTY_ALIASES.phasePlanLinkId, ["rich_text"]) || "");
        if (currentPlanId !== plan.planId) continue;
        const properties = {};
        setProperty(properties, planIdProperty, { rich_text: [] });
        setProperty(properties, planNameProperty, { rich_text: [] });
        await notionRequest(`/pages/${page.id}`, { method: "PATCH", body: JSON.stringify({ properties }) }, config);
        await wait(140);
      }
    };
    await clearSource(config.dailyPlanSourceId);
    await clearSource(config.dailyReviewSourceId);
    await clearSource(config.dailyArchiveSourceId);
  }

  async function deletePhasePlan(planInput, configInput) {
    const config = configInput || await getConfig();
    if (!planInput?.id) throw new Error("阶段计划 ID 无效。");
    await rewriteQueuedPhasePlanBindings(planInput, { remove: true });
    await clearPhasePlanBindings(planInput, config);
    await notionRequest(`/pages/${normalizeNotionId(planInput.id)}`, {
      method: "PATCH",
      body: JSON.stringify({ in_trash: true }),
    }, config);
    return true;
  }

  function defaultPlanningProfile() {
    return {
      profileId: "minimal-pomodoro:default",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Chongqing",
      pomodoroSettings: { workMinutes: 25, breakMinutes: 5 },
      workWindows: [],
      routineBlocks: [],
      dateOverrides: [],
      preferenceNote: "",
    };
  }

  function normalizePlanningProfile(input) {
    const base = defaultPlanningProfile();
    const validTime = (value) => /^([01]\d|2[0-3]):[0-5]\d$/.test(String(value || ""));
    const normalizeBlocks = (items, includeWeekdays) => (Array.isArray(items) ? items : []).map((item) => ({
      ...(includeWeekdays ? { weekdays: (Array.isArray(item?.weekdays) ? item.weekdays : []).map(Number).filter((day) => day >= 0 && day <= 6) } : {}),
      ...(item?.date ? { date: String(item.date).slice(0, 10) } : {}),
      start: String(item?.start || ""),
      end: String(item?.end || ""),
      ...(item?.label || item?.title ? { label: String(item.label || item.title).trim() } : {}),
      ...(item?.type ? { type: String(item.type) } : {}),
    })).filter((item) => validTime(item.start) && validTime(item.end) && item.start < item.end);
    return {
      ...base,
      profileId: String(input?.profileId || base.profileId),
      timezone: String(input?.timezone || base.timezone),
      pomodoroSettings: {
        workMinutes: Math.max(1, Math.min(180, Math.round(Number(input?.pomodoroSettings?.workMinutes) || 25))),
        breakMinutes: Math.max(1, Math.min(60, Math.round(Number(input?.pomodoroSettings?.breakMinutes) || 5))),
      },
      workWindows: normalizeBlocks(input?.workWindows, true),
      routineBlocks: normalizeBlocks(input?.routineBlocks, true),
      dateOverrides: normalizeBlocks(input?.dateOverrides, false),
      preferenceNote: String(input?.preferenceNote || "").trim(),
    };
  }

  function scheduleParts(value) {
    const match = String(value || "").match(/^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})/);
    return match ? { date: match[1], minutes: Number(match[2]) * 60 + Number(match[3]) } : null;
  }

  function scheduledDateTimeWithLocalOffset(value) {
    const text = String(value || "").trim();
    if (!text || /(?:Z|[+-]\d{2}:\d{2})$/i.test(text)) return text;
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?$/.test(text)) return text;
    const localDate = new Date(text);
    if (Number.isNaN(localDate.getTime())) return text;
    const offsetMinutes = -localDate.getTimezoneOffset();
    const sign = offsetMinutes >= 0 ? "+" : "-";
    const absolute = Math.abs(offsetMinutes);
    const offset = `${sign}${String(Math.floor(absolute / 60)).padStart(2, "0")}:${String(absolute % 60).padStart(2, "0")}`;
    return `${text}${offset}`;
  }

  function blockMinutes(block) {
    const parse = (value) => {
      const match = String(value || "").match(/^(\d{2}):(\d{2})$/);
      return match ? Number(match[1]) * 60 + Number(match[2]) : -1;
    };
    return { start: parse(block?.start), end: parse(block?.end) };
  }

  function validateTodoSchedules(dateKey, todos, profileInput, options = {}) {
    const profile = normalizePlanningProfile(profileInput);
    const weekday = new Date(`${dateKey}T12:00:00`).getDay();
    const windows = profile.workWindows.filter((item) => item.weekdays.includes(weekday));
    const blocked = [
      ...profile.routineBlocks.filter((item) => item.weekdays.includes(weekday)),
      ...profile.dateOverrides.filter((item) => item.date === dateKey),
    ];
    const scheduled = [];
    for (const todo of Array.isArray(todos) ? todos : []) {
      if (!todo?.plannedStart && !todo?.plannedEnd) continue;
      const start = scheduleParts(todo.plannedStart);
      const end = scheduleParts(todo.plannedEnd);
      if (!start || !end || start.date !== dateKey || end.date !== dateKey || start.minutes >= end.minutes) {
        throw new Error(`待办“${todo.title || "未命名"}”的计划时间无效。`);
      }
      const units = Number(todo.estimatedPomodoros);
      const requiredMinutes = units * profile.pomodoroSettings.workMinutes + Math.max(0, units - 1) * profile.pomodoroSettings.breakMinutes;
      if (units > 0 && end.minutes - start.minutes < requiredMinutes) {
        throw new Error(`待办“${todo.title}”的时段不足以容纳 ${units} 个专注番茄及内部休息。`);
      }
      if (!(options.allowWorkWindowOverrides && todo.workWindowOverride === true) && !windows.some((window) => {
        const range = blockMinutes(window);
        return start.minutes >= range.start && end.minutes <= range.end;
      })) throw new Error(`待办“${todo.title}”不在 ${dateKey} 的工作窗口内。`);
      if (blocked.some((block) => {
        const range = blockMinutes(block);
        return start.minutes < range.end && end.minutes > range.start;
      })) throw new Error(`待办“${todo.title}”与固定或不可用安排冲突。`);
      if (scheduled.some((item) => start.minutes < item.end && end.minutes > item.start)) {
        throw new Error(`待办“${todo.title}”与同日其他待办时间重叠。`);
      }
      scheduled.push({ start: start.minutes, end: end.minutes });
    }
    return true;
  }

  function validateTodoChangesAgainstExisting(dateKey, changedTodos, existingTodos, profileInput, options = {}) {
    validateTodoSchedules(dateKey, changedTodos, profileInput, options);
    const occupied = (Array.isArray(existingTodos) ? existingTodos : []).map((todo) => ({
      todo,
      start: scheduleParts(todo.plannedStart),
      end: scheduleParts(todo.plannedEnd),
    })).filter((item) => item.start && item.end && item.start.date === dateKey && item.end.date === dateKey);
    for (const todo of Array.isArray(changedTodos) ? changedTodos : []) {
      const start = scheduleParts(todo.plannedStart);
      const end = scheduleParts(todo.plannedEnd);
      if (!start || !end) continue;
      const conflict = occupied.find((item) => start.minutes < item.end.minutes && end.minutes > item.start.minutes);
      if (conflict) throw new Error(`待办“${todo.title}”与现有待办“${conflict.todo.title}”时间重叠。`);
    }
    return true;
  }

  function hasWorkWindowForDate(dateKey, profileInput) {
    const weekday = new Date(`${dateKey}T12:00:00`).getDay();
    return normalizePlanningProfile(profileInput).workWindows.some((item) => item.weekdays.includes(weekday));
  }

  function localDateKey(date) {
    return [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0"),
    ].join("-");
  }

  function manualPlanningWindow(dateKey, requestedAt, profileInput, preparationMinutes = 10, options = {}) {
    if (!requestedAt) return null;
    const requested = new Date(requestedAt);
    if (Number.isNaN(requested.getTime())) throw new Error("手动生成待办的触发时间无效。");
    const today = localDateKey(requested);
    if (dateKey < today) {
      const error = new Error(`不能为过去日期 ${dateKey} 重新生成待办。`);
      error.code = "past_date_not_schedulable";
      throw error;
    }
    if (dateKey > today) return null;
    const parsedPreparation = Number(preparationMinutes);
    const delay = Math.max(0, Math.min(120, Math.round(Number.isFinite(parsedPreparation) ? parsedPreparation : 10)));
    const earliest = new Date(requested.getTime() + delay * 60 * 1000);
    if (earliest.getSeconds() || earliest.getMilliseconds()) earliest.setMinutes(earliest.getMinutes() + 1, 0, 0);
    if (localDateKey(earliest) !== dateKey) {
      const error = new Error("今天已经没有可用于安排待办的时间。");
      error.code = "workday_finished";
      throw error;
    }
    const earliestMinutes = earliest.getHours() * 60 + earliest.getMinutes();
    const earliestClock = `${String(earliest.getHours()).padStart(2, "0")}:${String(earliest.getMinutes()).padStart(2, "0")}`;
    const weekday = earliest.getDay();
    const profile = normalizePlanningProfile(profileInput);
    const availableWindows = profile.workWindows
      .filter((item) => item.weekdays.includes(weekday))
      .map((item) => {
        const range = blockMinutes(item);
        const startMinutes = Math.max(range.start, earliestMinutes);
        return {
          startMinutes,
          endMinutes: range.end,
          start: `${dateKey}T${String(Math.floor(startMinutes / 60)).padStart(2, "0")}:${String(startMinutes % 60).padStart(2, "0")}:00`,
          end: `${dateKey}T${item.end}:00`,
        };
      })
      .filter((item) => item.startMinutes < item.endMinutes)
      .map(({ start, end }) => ({ start, end }));
    if (!availableWindows.length && !options.allowEmptyWindows) {
      const error = new Error(`${earliestClock} 之后已没有可用工作窗口，未调用 LLM。`);
      error.code = "workday_finished";
      throw error;
    }
    return {
      requestedAt: requested.toISOString(),
      preparationMinutes: delay,
      earliestStart: `${dateKey}T${earliestClock}:00`,
      requestedMinutes: requested.getHours() * 60 + requested.getMinutes(),
      earliestMinutes,
      availableWindows,
    };
  }

  function validateManualStartBoundary(todos, manualWindow) {
    if (!manualWindow) return true;
    for (const todo of Array.isArray(todos) ? todos : []) {
      if (!todo?.plannedStart) continue;
      const start = scheduleParts(todo.plannedStart);
      if (!start || start.minutes < manualWindow.earliestMinutes) {
        throw new Error(`待办“${todo.title || "未命名"}”早于手动排程起点 ${manualWindow.earliestStart.slice(11, 16)}。`);
      }
    }
    return true;
  }

  async function loadPlanningProfile(configInput) {
    const queuedProfile = [...await getQueuedWrites()].reverse().find((item) => item.kind === "planning_profile");
    if (queuedProfile?.payload?.profile) {
      return { ...normalizePlanningProfile(queuedProfile.payload.profile), pendingSync: true };
    }
    const config = configInput || await getConfig();
    const fallback = defaultPlanningProfile();
    if (!config.planningProfileSourceId) return fallback;
    const source = await resolveDataSource(config.planningProfileSourceId, config);
    const idProperty = findProperty(source.properties, PROPERTY_ALIASES.profileId, ["rich_text"]);
    if (!idProperty) return fallback;
    const updatedAtProperty = findProperty(source.properties, PROPERTY_ALIASES.updatedAt, ["date"]);
    const pages = await queryDataSource(source.id, {
      page_size: 100,
      filter: { property: idProperty[0], rich_text: { equals: fallback.profileId } },
      ...(updatedAtProperty ? { sorts: [{ property: updatedAtProperty[0], direction: "descending" }] } : {}),
    }, config);
    // Planning Profile is append-only. Prefer the explicit business timestamp and
    // fall back to Notion's edit timestamp for legacy rows that predate it.
    const page = pages.sort((left, right) => {
      const leftUpdated = String(pagePropertyValue(left, PROPERTY_ALIASES.updatedAt, ["date"]) || left.last_edited_time || left.created_time || "");
      const rightUpdated = String(pagePropertyValue(right, PROPERTY_ALIASES.updatedAt, ["date"]) || right.last_edited_time || right.created_time || "");
      return rightUpdated.localeCompare(leftUpdated);
    })[0];
    if (!page) return fallback;
    const raw = pagePropertyValue(page, PROPERTY_ALIASES.configJson, ["rich_text"]);
    return { ...normalizePlanningProfile(parseJson(raw, fallback)), id: page.id, url: page.url };
  }

  async function savePlanningProfile(profileInput, configInput, options = {}) {
    const config = configInput || await getConfig();
    if (!config.planningProfileSourceId) throw new Error("请先绑定 Planning Profile 数据源。");
    const profile = normalizePlanningProfile(profileInput);
    if (!profile.workWindows.length && !options.allowEmpty) throw new Error("请至少设置一个工作/学习时间窗口。");
    const source = await resolveDataSource(config.planningProfileSourceId, config);
    const properties = {};
    const savedAt = new Date().toISOString();
    setProperty(properties, findTitleProperty(source.properties), { title: richText(`个人节奏 · ${savedAt.slice(0, 19).replace("T", " ")}`) });
    setProperty(properties, findProperty(source.properties, PROPERTY_ALIASES.profileId, ["rich_text"]), { rich_text: richText(profile.profileId) });
    setProperty(properties, findProperty(source.properties, PROPERTY_ALIASES.timezone, ["rich_text"]), { rich_text: richText(profile.timezone) });
    setProperty(properties, findProperty(source.properties, PROPERTY_ALIASES.workWindowsSummary, ["rich_text"]), {
      rich_text: richTextLong(profile.workWindows.map((item) => `${item.weekdays.join("/")} ${item.start}-${item.end}`).join("；")),
    });
    setProperty(properties, findProperty(source.properties, PROPERTY_ALIASES.routineSummary, ["rich_text"]), {
      rich_text: richTextLong(profile.routineBlocks.map((item) => `${item.label || "固定安排"} ${item.start}-${item.end}`).join("；")),
    });
    setProperty(properties, findProperty(source.properties, PROPERTY_ALIASES.preferenceNote, ["rich_text"]), { rich_text: richTextLong(profile.preferenceNote) });
    setProperty(properties, findProperty(source.properties, PROPERTY_ALIASES.configJson, ["rich_text"]), { rich_text: richTextLong(JSON.stringify(profile)) });
    setProperty(properties, findProperty(source.properties, PROPERTY_ALIASES.updatedAt, ["date"]), { date: { start: savedAt } });
    // Keep every revision as a separate Notion page. loadPlanningProfile selects
    // the newest revision, so old configurations remain available for auditing.
    const page = await notionRequest("/pages", {
      method: "POST",
      body: JSON.stringify({ parent: { type: "data_source_id", data_source_id: source.id }, properties }),
    }, config);
    return { ...profile, id: page.id, url: page.url };
  }

  async function findDailyReviewPages(dateKey, source, config) {
    const dateProperty = findProperty(source.properties, PROPERTY_ALIASES.date, ["date"]);
    if (!dateProperty) throw new Error("Daily Review 数据源缺少“日期”Date 属性。");
    const pages = await queryDataSource(source.id, {
      page_size: 100,
      filter: { property: dateProperty[0], date: { equals: dateKey } },
    }, config);
    return pages.sort((left, right) => {
      const richness = (page) => [
        PROPERTY_ALIASES.userCompletion,
        PROPERTY_ALIASES.dailySummary,
        PROPERTY_ALIASES.timeAnalysis,
        PROPERTY_ALIASES.problemAnalysis,
        PROPERTY_ALIASES.nextFocus,
      ].filter((aliases) => String(pagePropertyValue(page, aliases, ["rich_text"]) || "").trim()).length;
      const richnessDifference = richness(right) - richness(left);
      if (richnessDifference) return richnessDifference;
      return String(right.last_edited_time || right.created_time || "")
        .localeCompare(String(left.last_edited_time || left.created_time || ""));
    });
  }

  async function findDailyReviewPage(dateKey, source, config) {
    return (await findDailyReviewPages(dateKey, source, config))[0] || null;
  }

  async function loadDailyCompletion(dateKey, configInput) {
    const queued = [...await getQueuedWrites()].reverse().find((item) => item.kind === "daily_completion" && item.payload?.dateKey === dateKey);
    if (queued) return String(queued.payload.completion || "").trim();
    const config = configInput || await getConfig();
    if (!config.dailyReviewSourceId) return "";
    const source = await resolveDataSource(config.dailyReviewSourceId, config);
    const pages = await findDailyReviewPages(dateKey, source, config);
    return pages.map((page) => String(pagePropertyValue(page, PROPERTY_ALIASES.userCompletion, ["rich_text"]) || "").trim())
      .find(Boolean) || "";
  }

  async function loadDailyReview(dateKey, configInput) {
    const config = configInput || await getConfig();
    if (!config.dailyReviewSourceId) {
      return { date: dateKey, userCompletion: "", dailySummary: "", timeAnalysis: "", problemAnalysis: "", nextFocus: "" };
    }
    const source = await resolveDataSource(config.dailyReviewSourceId, config);
    const pages = await findDailyReviewPages(dateKey, source, config);
    const page = pages[0] || null;
    const mergedValue = (aliases) => pages
      .map((item) => String(pagePropertyValue(item, aliases, ["rich_text"]) || "").trim())
      .find(Boolean) || "";
    const review = {
      id: page?.id || "",
      url: page?.url || "",
      date: dateKey,
      userCompletion: mergedValue(PROPERTY_ALIASES.userCompletion),
      dailySummary: mergedValue(PROPERTY_ALIASES.dailySummary),
      timeAnalysis: mergedValue(PROPERTY_ALIASES.timeAnalysis),
      problemAnalysis: mergedValue(PROPERTY_ALIASES.problemAnalysis),
      nextFocus: mergedValue(PROPERTY_ALIASES.nextFocus),
      phasePlanId: mergedValue(PROPERTY_ALIASES.phasePlanLinkId),
      phasePlanName: mergedValue(PROPERTY_ALIASES.phasePlanName),
      duplicateCount: Math.max(0, pages.length - 1),
      lifeRecord: findProperty(source.properties, PROPERTY_ALIASES.lifeRecord, ["rich_text"])
        ? lifeRecordFromPages(dateKey, pages) : null,
    };
    const queued = [...await getQueuedWrites()].reverse().find((item) => item.kind === "daily_completion" && item.payload?.dateKey === dateKey);
    if (queued) {
      review.userCompletion = String(queued.payload.completion || "").trim();
      review.pendingSync = true;
    }
    return review;
  }

  function lifeRecordFromPages(dateKey, pages) {
    const page = [...pages].sort((a, b) => String(b.last_edited_time || "").localeCompare(String(a.last_edited_time || "")))
      .find((item) => findProperty(item.properties, PROPERTY_ALIASES.lifeRecord, ["rich_text"]));
    return page ? {
      date: dateKey, text: (findProperty(page.properties, PROPERTY_ALIASES.lifeRecord, ["rich_text"])[1].rich_text || [])
        .map((item) => item.plain_text ?? item.text?.content ?? "").join(""),
      url: page.url || "", updatedAt: page.last_edited_time || "",
    } : null;
  }

  async function loadLifeRecordsInRange(startKey, endKey, configInput) {
    const config = configInput || await getConfig();
    if (!config.dailyReviewSourceId) return [];
    const source = await resolveDataSource(config.dailyReviewSourceId, config);
    if (!findProperty(source.properties, PROPERTY_ALIASES.lifeRecord, ["rich_text"])) return [];
    const date = findProperty(source.properties, PROPERTY_ALIASES.date, ["date"]);
    if (!date) throw new Error("Daily Review 缺少日期字段。");
    const pages = await queryDataSource(source.id, {
      page_size: 100, filter: { and: [
        { property: date[0], date: { on_or_after: startKey } },
        { property: date[0], date: { on_or_before: endKey } },
      ] },
    }, config);
    const groups = new Map();
    for (const page of pages) {
      const key = String(pagePropertyValue(page, PROPERTY_ALIASES.date, ["date"]) || "").slice(0, 10);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) continue;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(page);
    }
    return [...groups].map(([key, group]) => lifeRecordFromPages(key, group)).filter(Boolean);
  }

  async function saveLifeRecord(dateKey, text, configInput) {
    const config = configInput || await getConfig();
    if (!config.dailyReviewSourceId) throw new Error("请先绑定 Daily Review 数据源，生活记录已保存在本地。");
    let source = await resolveDataSource(config.dailyReviewSourceId, config);
    if (!findProperty(source.properties, PROPERTY_ALIASES.lifeRecord, ["rich_text"])) {
      source = (await ensureWorkspaceSchema("dailyReview", source, config)).source;
    }
    const field = findProperty(source.properties, PROPERTY_ALIASES.lifeRecord, ["rich_text"]);
    if (!field) throw new Error("Daily Review 的生活记录字段必须是 Rich text。");
    const value = String(text || "");
    if (value.length > 18000) throw new Error("单日生活记录最多 18000 字。");
    const chunks = [];
    for (let index = 0; index < value.length; index += 1800) chunks.push({ type: "text", text: { content: value.slice(index, index + 1800) } });
    const properties = { [field[0]]: { rich_text: chunks } };
    const pages = await findDailyReviewPages(dateKey, source, config);
    if (pages.length) {
      const page = await notionRequest(`/pages/${pages[0].id}`, { method: "PATCH", body: JSON.stringify({ properties }) }, config);
      // Keep legacy duplicate rows consistent so unrelated review edits cannot revive old text.
      for (const duplicate of pages.slice(1)) {
        await notionRequest(`/pages/${duplicate.id}`, { method: "PATCH", body: JSON.stringify({ properties }) }, config);
        await wait(120);
      }
      return page;
    }
    setProperty(properties, findTitleProperty(source.properties), { title: richText(`${dateKey} 日报`) });
    setProperty(properties, findProperty(source.properties, PROPERTY_ALIASES.date, ["date"]), { date: { start: dateKey } });
    return notionRequest("/pages", { method: "POST", body: JSON.stringify({ parent: { type: "data_source_id", data_source_id: source.id }, properties }) }, config);
  }

  async function saveDailyCompletion(dateKey, completion, configInput) {
    const text = String(completion || "").trim();
    const config = configInput || await getConfig();
    if (!config.dailyReviewSourceId) throw new Error("请先绑定 Daily Review 数据源。");
    const source = await resolveDataSource(config.dailyReviewSourceId, config);
    const title = findTitleProperty(source.properties);
    const date = findProperty(source.properties, PROPERTY_ALIASES.date, ["date"]);
    const userCompletion = findProperty(source.properties, PROPERTY_ALIASES.userCompletion, ["rich_text"]);
    if (!userCompletion) throw new Error("Daily Review 缺少“用户完成情况”Rich text 属性。");
    const properties = {};
    setProperty(properties, title, { title: richText(`${dateKey} 日报`) });
    setProperty(properties, date, { date: { start: dateKey } });
    setProperty(properties, userCompletion, { rich_text: richText(text) });
    const phasePlan = await loadPhasePlan(dateKey, config);
    setProperty(properties, findProperty(source.properties, PROPERTY_ALIASES.phasePlanLinkId, ["rich_text"]), {
      rich_text: richText(phasePlan?.planId || ""),
    });
    setProperty(properties, findProperty(source.properties, PROPERTY_ALIASES.phasePlanName, ["rich_text"]), {
      rich_text: richText(phasePlan?.title || ""),
    });
    const existingPages = await findDailyReviewPages(dateKey, source, config);
    const existing = existingPages[0] || null;
    if (existing) {
      const saved = await notionRequest(`/pages/${existing.id}`, {
        method: "PATCH",
        body: JSON.stringify({ properties }),
      }, config);
      // Clearing must also clear duplicate rows left by older versions;
      // otherwise merged reads would surface an old non-empty value again.
      if (!text) {
        for (const duplicate of existingPages.slice(1)) {
          await notionRequest(`/pages/${duplicate.id}`, {
            method: "PATCH",
            body: JSON.stringify({ properties: { [userCompletion[0]]: { rich_text: [] } } }),
          }, config);
          await wait(120);
        }
      }
      return saved;
    }
    return notionRequest("/pages", {
      method: "POST",
      body: JSON.stringify({ parent: { type: "data_source_id", data_source_id: source.id }, properties }),
    }, config);
  }

  function generatedTodoId(dateKey, title) {
    const value = `${dateKey}:${String(title || "").trim().toLowerCase()}`;
    let hash = 2166136261;
    for (let index = 0; index < value.length; index += 1) {
      hash ^= value.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return `llm:${dateKey}:${(hash >>> 0).toString(16)}`;
  }

  function buildDailyTodoProperties(dateKey, todo, schema) {
    const properties = {};
    const title = findTitleProperty(schema);
    const date = findProperty(schema, PROPERTY_ALIASES.date, ["date"]);
    const todoId = findProperty(schema, PROPERTY_ALIASES.todoId, ["rich_text"]);
    const status = findProperty(schema, PROPERTY_ALIASES.status, ["select", "status"]);
    const completed = findProperty(schema, PROPERTY_ALIASES.completed, ["checkbox"]);
    const priority = findProperty(schema, PROPERTY_ALIASES.priority, ["select"]);
    const details = findProperty(schema, PROPERTY_ALIASES.details, ["rich_text"]);
    const source = findProperty(schema, PROPERTY_ALIASES.source, ["rich_text"]);
    const estimate = findProperty(schema, PROPERTY_ALIASES.estimatedPomodoros, ["number"]);
    const plannedTime = findProperty(schema, PROPERTY_ALIASES.plannedTime, ["date"]);
    const origin = findProperty(schema, PROPERTY_ALIASES.origin, ["select"]);
    const adjustmentNote = findProperty(schema, PROPERTY_ALIASES.adjustmentNote, ["rich_text"]);
    const phasePlanLinkId = findProperty(schema, PROPERTY_ALIASES.phasePlanLinkId, ["rich_text"]);
    const phasePlanName = findProperty(schema, PROPERTY_ALIASES.phasePlanName, ["rich_text"]);
    setProperty(properties, title, { title: richText(todo.title) });
    setProperty(properties, date, { date: { start: dateKey } });
    setProperty(properties, todoId, { rich_text: richText(todo.id) });
    if (status) {
      setProperty(properties, status, status[1].type === "status"
        ? { status: { name: todo.status || "pending" } }
        : { select: { name: todo.status || "pending" } });
    }
    setProperty(properties, completed, { checkbox: todo.status === "done" });
    setProperty(properties, priority, { select: { name: todo.priority || "medium" } });
    setProperty(properties, details, { rich_text: richText(todo.details) });
    setProperty(properties, source, { rich_text: richText(todo.source) });
    setProperty(properties, estimate, { number: todo.estimatedPomodoros == null ? null : Math.max(0, Math.round(Number(todo.estimatedPomodoros) || 0)) });
    setProperty(properties, findProperty(schema, PROPERTY_ALIASES.planningMode, ["select"]), { select: { name: todo.planningMode || "explicit" } });
    setProperty(properties, findProperty(schema, PROPERTY_ALIASES.effortBasis, ["select"]), { select: { name: todo.effortBasis || "task_estimate" } });
    setProperty(properties, findProperty(schema, PROPERTY_ALIASES.targetProgressPercent, ["number"]), { number: todo.targetProgressPercent ?? null });
    setProperty(properties, findProperty(schema, PROPERTY_ALIASES.phaseTaskId, ["rich_text"]), { rich_text: richText(todo.phaseTaskId || "") });
    // A timezone-less ISO datetime is interpreted as UTC by Notion. Todo times
    // are wall-clock times chosen in the extension, so attach the device's
    // offset before writing to prevent (for example) 18:00 becoming 02:00.
    const plannedStart = scheduledDateTimeWithLocalOffset(todo.plannedStart);
    const plannedEnd = scheduledDateTimeWithLocalOffset(todo.plannedEnd);
    setProperty(properties, plannedTime, {
      date: plannedStart ? { start: plannedStart, ...(plannedEnd ? { end: plannedEnd } : {}) } : null,
    });
    setProperty(properties, origin, { select: { name: todo.origin === "user" ? "user" : "llm" } });
    setProperty(properties, adjustmentNote, { rich_text: richTextLong(todo.adjustmentNote) });
    setProperty(properties, phasePlanLinkId, { rich_text: richText(todo.phasePlanId) });
    setProperty(properties, phasePlanName, { rich_text: richText(todo.phasePlanName) });
    return properties;
  }

  async function upsertDailyTodos(dateKey, todos, configInput, options = {}) {
    const config = configInput || await getConfig();
    if (!config.dailyPlanSourceId) throw new Error("请先绑定 Daily Todo 数据源。");
    const todoItems = (Array.isArray(todos) ? todos : []).filter((item) => String(item?.title || "").trim());
    if (!todoItems.length) return { created: 0, updated: 0, total: 0 };
    const resolvedSource = await resolveDataSource(config.dailyPlanSourceId, config);
    const { source } = await ensureWorkspaceSchema("dailyPlan", resolvedSource, config);
    const idProperty = findProperty(source.properties, PROPERTY_ALIASES.todoId, ["rich_text"]);
    const summary = { created: 0, updated: 0, total: 0 };
    for (const [index, rawTodo] of todoItems.entries()) {
      const title = String(rawTodo?.title || "").trim();
      if (!title) continue;
      const todo = {
        id: String(rawTodo.externalId || (String(rawTodo.id || "").startsWith("llm:") ? rawTodo.id : "") || generatedTodoId(dateKey, title)),
        title,
        priority: ["high", "medium", "low"].includes(rawTodo.priority) ? rawTodo.priority : "medium",
        details: String(rawTodo.details || "").trim(),
        source: String(rawTodo.source ?? "phase_plan").trim(),
        planningMode: rawTodo.planningMode || "explicit",
        targetProgressPercent: rawTodo.targetProgressPercent ?? null,
        phaseTaskId: rawTodo.phaseTaskId || null,
        effortBasis: rawTodo.effortBasis || "task_estimate",
        estimatedPomodoros: rawTodo.estimatedPomodoros === null ? null : Math.min(20, Math.max(0, Number(rawTodo.estimatedPomodoros) || 0)),
        status: ["pending", "in_progress", "done"].includes(rawTodo.status) ? rawTodo.status : "pending",
        plannedStart: rawTodo.plannedStart === null ? null : String(rawTodo.plannedStart || "").trim(),
        plannedEnd: rawTodo.plannedEnd === null ? null : String(rawTodo.plannedEnd || "").trim(),
        origin: rawTodo.origin === "user" ? "user" : "llm",
        adjustmentNote: String(rawTodo.adjustmentNote || "").trim(),
        phasePlanId: String(rawTodo.phasePlanId || "").trim(),
        phasePlanName: String(rawTodo.phasePlanName || "").trim(),
      };
      const existing = rawTodo.id && !String(rawTodo.id).startsWith("llm:")
        ? { id: normalizeNotionId(rawTodo.id) }
        : await findPageByExternalId(source.id, idProperty, todo.id, config);
      if (existing?.properties) {
        const existingStatus = pagePropertyValue(existing, PROPERTY_ALIASES.status, ["select", "status"]);
        const existingOrigin = pagePropertyValue(existing, PROPERTY_ALIASES.origin, ["select"]);
        if (existingStatus === "done") todo.status = "done";
        if (existingOrigin === "user") todo.origin = "user";
      }
      const properties = buildDailyTodoProperties(dateKey, todo, source.properties);
      await options.onProgress?.({
        phase: "writing",
        action: existing ? "update" : "create",
        current: index + 1,
        total: todoItems.length,
        title: todo.title,
      });
      if (existing) {
        await notionRequest(`/pages/${existing.id}`, { method: "PATCH", body: JSON.stringify({ properties }) }, config);
        summary.updated += 1;
      } else {
        await notionRequest("/pages", {
          method: "POST",
          body: JSON.stringify({ parent: { type: "data_source_id", data_source_id: source.id }, properties }),
        }, config);
        summary.created += 1;
      }
      summary.total += 1;
      await wait(340);
    }
    return summary;
  }

  async function saveDailyTodo(dateKey, todo, configInput) {
    const config = configInput || await getConfig();
    const item = { ...todo, origin: todo?.origin || "user" };
    if (!item.id && !item.externalId) item.externalId = `user:${dateKey}:${Date.now().toString(36)}`;
    // User-created schedules are intentional overrides. LLM-created and adjusted
    // schedules are validated against work windows before they reach this path.
    const start = scheduleParts(item.plannedStart);
    const end = scheduleParts(item.plannedEnd);
    if ((item.plannedStart || item.plannedEnd) &&
      (!start || !end || start.date !== dateKey || end.date !== dateKey || start.minutes >= end.minutes)) {
      throw new Error(`待办“${item.title || "未命名"}”的计划时间无效。`);
    }
    return upsertDailyTodos(dateKey, [item], config);
  }

  async function setDailyTodoStatus(pageId, nextStatus, configInput) {
    if (!["pending", "in_progress", "done"].includes(nextStatus)) throw new Error("无效的待办状态。");
    const config = configInput || await getConfig();
    if (!config.dailyPlanSourceId || !pageId) throw new Error("待办或 Daily Todo 数据源无效。");
    const source = await resolveDataSource(config.dailyPlanSourceId, config);
    const properties = {};
    const status = findProperty(source.properties, PROPERTY_ALIASES.status, ["select", "status"]);
    const completed = findProperty(source.properties, PROPERTY_ALIASES.completed, ["checkbox"]);
    setProperty(properties, status, status?.[1]?.type === "status"
      ? { status: { name: nextStatus } }
      : { select: { name: nextStatus } });
    setProperty(properties, completed, { checkbox: nextStatus === "done" });
    await notionRequest(`/pages/${normalizeNotionId(pageId)}`, {
      method: "PATCH", body: JSON.stringify({ properties }),
    }, config);
    return true;
  }

  async function deleteDailyTodo(pageId, configInput) {
    const config = configInput || await getConfig();
    if (!pageId) throw new Error("待办 ID 无效。");
    await notionRequest(`/pages/${normalizeNotionId(pageId)}`, {
      method: "PATCH", body: JSON.stringify({ in_trash: true }),
    }, config);
    return true;
  }

  async function markDailyTodoStarted(pageId, configInput) {
    return setDailyTodoStatus(pageId, "in_progress", configInput);
  }

  function buildDailyReviewProperties(dateKey, review, schema) {
    const properties = {};
    const title = findTitleProperty(schema);
    if (!title) throw new Error("Daily Review 数据源缺少标题属性。");
    setProperty(properties, title, { title: richText(`${dateKey} 日报`) });
    const date = findProperty(schema, PROPERTY_ALIASES.date, ["date"]);
    setProperty(properties, date, { date: { start: dateKey } });
    const fields = [
      [PROPERTY_ALIASES.dailySummary, review.dailySummary || review.summary],
      [PROPERTY_ALIASES.timeAnalysis, review.timeAnalysis],
      [PROPERTY_ALIASES.problemAnalysis, review.problemAnalysis],
      [PROPERTY_ALIASES.nextFocus, review.nextFocus],
      [PROPERTY_ALIASES.phasePlanLinkId, review.phasePlanId],
      [PROPERTY_ALIASES.phasePlanName, review.phasePlanName],
    ];
    for (const [aliases, value] of fields) {
      const property = findProperty(schema, aliases, ["rich_text"]);
      setProperty(properties, property, { rich_text: richText(value) });
    }
    return properties;
  }

  async function writeDailyReview(dateKey, review, configInput) {
    const config = configInput || await getConfig();
    if (!config.dailyReviewSourceId) throw new Error("请先绑定 Daily Review 数据源。");
    const source = await resolveDataSource(config.dailyReviewSourceId, config);
    const dateProperty = findProperty(source.properties, PROPERTY_ALIASES.date, ["date"]);
    if (!dateProperty) throw new Error("Daily Review 数据源缺少“日期”Date 属性。");
    // Older versions could leave multiple review rows for one date. Reuse the
    // same canonical row as completion reads/writes instead of updating an
    // arbitrary query result.
    const existing = await findDailyReviewPage(dateKey, source, config);
    const properties = buildDailyReviewProperties(dateKey, review, source.properties);
    if (existing) {
      return notionRequest(`/pages/${existing.id}`, {
        method: "PATCH",
        body: JSON.stringify({ properties }),
      }, config);
    }
    return notionRequest("/pages", {
      method: "POST",
      body: JSON.stringify({
        parent: { type: "data_source_id", data_source_id: source.id },
        properties,
      }),
    }, config);
  }

  async function callLlm(action, payload, configInput, lengthRepair = false) {
    const config = configInput || await getConfig();
    if (!config.llmEndpoint || !config.llmModel || !config.llmApiKey) {
      throw new Error("请先在插件中填写 LLM 接口地址、模型 ID 和 API Key。");
    }
    if (!prompts) throw new Error("V2 提示词模块尚未载入，请重新加载扩展。");
    const messages = prompts.buildMessages(action, payload);
    let endpoint;
    try {
      endpoint = new URL(config.llmEndpoint);
    } catch {
      throw new Error("LLM 接口地址无效。");
    }
    if (endpoint.protocol !== "https:") throw new Error("LLM 接口必须使用 HTTPS。");
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);
    let response;
    try {
      response = await fetch(endpoint.href, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.llmApiKey}`,
        },
        body: JSON.stringify({
          model: config.llmModel,
          thinking: { type: "enabled" },
          reasoning_effort: "medium", // DeepSeek maps medium to its actual high effort tier.
          temperature: 0.2,
          response_format: { type: "json_object" },
          messages,
        }),
        signal: controller.signal,
      });
    } catch (error) {
      if (error?.name === "AbortError") {
        const timeoutError = new Error("LLM 请求超过 60 秒未返回，本次未进入 Notion 写入阶段。");
        timeoutError.code = "llm_timeout";
        throw timeoutError;
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      const detail = body?.error?.message || body?.message || body?.error || "";
      throw new Error(`LLM 请求失败（HTTP ${response.status}）${detail ? `：${String(detail).slice(0, 300)}` : ""}`);
    }
    const result = await response.json().catch(() => null);
    const usage = Object.fromEntries(["prompt_tokens", "completion_tokens", "prompt_cache_hit_tokens", "prompt_cache_miss_tokens"]
      .filter(key => Number.isFinite(result?.usage?.[key])).map(key => [key, result.usage[key]]));
    if (Object.keys(usage).length) global.console?.debug?.("LLM usage", { action, taskVariant: payload.taskVariant || null, promptVersion: prompts.compileSystem(action, payload.taskVariant).definition.promptVersion, ...usage });
    const content = result?.choices?.[0]?.message?.content;
    if (!content) throw new Error("LLM 返回为空或响应格式不兼容。");
    let generated;
    try {
      generated = JSON.parse(content);
    } catch {
      throw new Error(`LLM 没有返回合法 JSON：${String(content).slice(0, 160)}`);
    }
    try {
      prompts.validateOutput(action, payload, generated);
    } catch (error) {
      if (error.code !== "llm_output_length" || lengthRepair) throw error;
      return callLlm(action, { ...payload, outputLengthFeedback: error.message, previousResult: generated }, config, true);
    }
    return cleanLlmResult(action, generated);
  }

  function cleanLlmText(value) {
    return String(value ?? "").trim();
  }

  function cleanLlmList(value) {
    return (Array.isArray(value) ? value : []).map((item) => cleanLlmText(item));
  }

  function cleanMilestoneTaskEstimates(value) {
    return (Array.isArray(value) ? value : []).map((item) => ({
      title: cleanLlmText(item?.title || item?.task, 300),
      estimatedMinutes: Math.max(0, Math.round(Number(item?.estimatedMinutes) || 0)),
      deliverable: cleanLlmText(item?.deliverable || item?.outcome, 500),
    })).filter((item) => item.title);
  }

  function cleanMilestone(item) {
    const taskEstimates = cleanMilestoneTaskEstimates(item?.taskEstimates || item?.tasks);
    return {
      date: cleanLlmText(item?.date, 10),
      planningMode: item.planningMode,
      targetProgressPercent: item.targetProgressPercent,
      taskProgress: (item.taskProgress || []).map(task => ({ taskId: task.taskId, title: task.title, targetProgressPercent: task.targetProgressPercent })),
      goal: cleanLlmText(item?.goal || item?.title || item?.outcome),
      deliverables: cleanLlmList(item?.deliverables),
      taskEstimates,
      estimatedMinutes: item.estimatedMinutes,
      notes: cleanLlmText(item?.notes),
    };
  }

  function cleanLlmTodos(value) {
    return (Array.isArray(value) ? value : []).slice(0, 8).map((todo) => ({
      ...(todo?.id ? { id: cleanLlmText(todo.id, 100) } : {}),
      ...(todo?.externalId ? { externalId: cleanLlmText(todo.externalId, 100) } : {}),
      title: cleanLlmText(todo?.title, 200),
      planningMode: todo.planningMode,
      targetProgressPercent: todo.targetProgressPercent,
      phaseTaskId: todo.phaseTaskId || null,
      effortBasis: todo.effortBasis,
      details: cleanLlmText(todo?.details),
      priority: ["high", "medium", "low"].includes(todo?.priority) ? todo.priority : "medium",
      estimatedPomodoros: todo.estimatedPomodoros,
      source: cleanLlmText(todo?.source),
      plannedStart: todo.plannedStart,
      plannedEnd: todo.plannedEnd,
      origin: todo?.origin === "user" ? "user" : "llm",
      adjustmentNote: cleanLlmText(todo?.adjustmentNote),
      workWindowOverride: todo?.workWindowOverride === true,
    })).filter((todo) => todo.title);
  }

  function cleanLlmResult(action, generated) {
    if (action === "time_record.parse") {
      return {
        status: cleanLlmText(generated.status || "ok", 30),
        blockedReason: cleanLlmText(generated.blockedReason),
        records: (Array.isArray(generated.records) ? generated.records : []).slice(0, 24).map((record) => ({
          type: ["work", "break", "life", "entertainment"].includes(record?.type) ? record.type : "life",
          content: cleanLlmText(record?.content || record?.title, 80),
          start: cleanLlmText(record?.start, 40),
          end: cleanLlmText(record?.end, 40),
          note: cleanLlmText(record?.note, 500),
        })).filter((record) => record.content),
      };
    }
    if (action === "phase_plan.decompose") {
      const source = Array.isArray(generated.milestones)
        ? generated.milestones
        : Array.isArray(generated.dailyMilestones) ? generated.dailyMilestones : [];
      return {
        status: cleanLlmText(generated.status || "ok", 30),
        blockedReason: cleanLlmText(generated.blockedReason),
        planTitle: cleanLlmText(generated.planTitle || generated.title, 200),
        summary: cleanLlmText(generated.summary || generated.phaseSummary),
        assumptions: cleanLlmList(generated.assumptions),
        questions: cleanLlmList(generated.questions),
        milestones: source.map(cleanMilestone),
      };
    }
    if (action === "phase_plan.adjust") {
      return {
        status: cleanLlmText(generated.status || "ok", 30),
        blockedReason: cleanLlmText(generated.blockedReason),
        changeSummary: cleanLlmText(generated.changeSummary),
        milestones: (Array.isArray(generated.milestones) ? generated.milestones : []).map(cleanMilestone),
        warnings: cleanLlmList(generated.warnings),
      };
    }
    if (action === "phase_plan.summarize") {
      return {
        status: cleanLlmText(generated.status || "ok", 30),
        blockedReason: cleanLlmText(generated.blockedReason),
        phaseSummary: cleanLlmText(generated.phaseSummary),
        achievementSummary: cleanLlmText(generated.achievementSummary),
        timeAnalysis: cleanLlmText(generated.timeAnalysis),
        unfinishedItems: cleanLlmList(generated.unfinishedItems),
        lessons: cleanLlmList(generated.lessons),
        nextSuggestions: cleanLlmList(generated.nextSuggestions),
      };
    }
    if (action === "daily_todo.adjust" || action === "daily_todo.adjust_repair" || action === "daily_todo.intraday_adjust" || action === "daily_todo.intraday_repair" || action === "daily_todo.initial" || action === "daily_todo.generate") {
      return {
        status: cleanLlmText(generated.status || "ok", 30),
        blockedReason: cleanLlmText(generated.blockedReason),
        changeSummary: cleanLlmText(generated.changeSummary),
        todos: cleanLlmTodos(generated.todos || generated.nextDayTodos),
        deletedTodoIds: cleanLlmList(generated.deletedTodoIds),
        fixedSchedule: Array.isArray(generated.fixedSchedule) ? generated.fixedSchedule : [],
        deferredTodos: cleanLlmList(generated.deferredTodos),
        warnings: cleanLlmList(generated.warnings),
      };
    }
    const review = generated.review || generated;
    return {
      status: cleanLlmText(generated.status || "ok", 30),
      blockedReason: cleanLlmText(generated.blockedReason),
      review: generated.review === null ? null : {
        dailySummary: cleanLlmText(review.dailySummary),
        timeAnalysis: cleanLlmText(review.timeAnalysis),
        problemAnalysis: cleanLlmText(review.problemAnalysis),
        nextFocus: cleanLlmText(review.nextFocus),
      },
      nextDayTodos: cleanLlmTodos(generated.nextDayTodos || review.nextDayTodos),
      fixedSchedule: Array.isArray(generated.fixedSchedule) ? generated.fixedSchedule : [],
      deferredTodos: cleanLlmList(generated.deferredTodos),
      warnings: cleanLlmList(generated.warnings),
    };
  }

  function milestoneForDate(plan, dateKey) {
    return (Array.isArray(plan?.milestones) ? plan.milestones : []).find((item) => item?.date === dateKey) || null;
  }

  function expectedDateKeys(startKey, endKey) {
    const keys = [];
    for (let key = startKey; key <= endKey; key = addDaysToDateKey(key, 1)) keys.push(key);
    return keys;
  }

  async function parseNaturalLanguageTimeRecords(dateKey, instruction, configInput) {
    const config = configInput || await getConfig();
    const selectedDate = String(dateKey || "").slice(0, 10);
    const text = String(instruction || "").trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(selectedDate)) throw new Error("请选择有效的补充日期。");
    if (!text) throw new Error("请描述需要补充的时间记录。");
    const existingRecords = (await loadAllLocalRecords()).filter((record) => (
      record.dateKey === selectedDate && record.start != null && record.end != null && Number.isFinite(Number(record.start)) && Number.isFinite(Number(record.end))
    ));
    const result = await callLlm("time_record.parse", {
      selectedDate,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Shanghai",
      instruction: text,
      existingRecords: existingRecords.map((record) => ({
        type: record.type,
        content: getRecordTitle(record),
        start: new Date(Number(record.start)).toISOString(),
        end: new Date(Number(record.end)).toISOString(),
      })),
    }, config);
    if (result.status === "blocked") throw new Error(result.blockedReason || "描述中的时间信息不足，无法安全补录。");
    if (!result.records.length) return result;

    const records = result.records.map((record) => {
      const start = Date.parse(record.start);
      const end = Date.parse(record.end);
      if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
        throw new Error(`“${record.content}”的开始或结束时间无效。`);
      }
      if (localDateKey(new Date(start)) !== selectedDate || localDateKey(new Date(end - 1)) !== selectedDate) {
        throw new Error(`“${record.content}”的时间超出了所选日期 ${selectedDate}。`);
      }
      return { ...record, start, end };
    }).sort((left, right) => left.start - right.start);

    const occupied = existingRecords.map((record) => ({
      start: Number(record.start),
      end: Number(record.end),
      content: getRecordTitle(record),
    }));
    for (const record of records) {
      const conflict = occupied.find((item) => record.start < item.end && record.end > item.start);
      if (conflict) throw new Error(`“${record.content}”与已有记录“${conflict.content}”时间重叠，请调整描述后重试。`);
      occupied.push(record);
    }
    return { ...result, records };
  }

  function validateAdjustedMilestones(milestones, startKey, endKey) {
    const expected = expectedDateKeys(startKey, endKey);
    const actual = (Array.isArray(milestones) ? milestones : []).map((item) => item.date);
    const unique = new Set(actual);
    const missing = expected.filter((key) => !unique.has(key));
    const unexpected = actual.filter((key) => key < startKey || key > endKey);
    if (actual.length !== unique.size) throw new Error("LLM 调整结果包含重复日期，请重新生成。");
    if (actual.some((key, index) => key !== expected[index])) throw new Error("LLM 调整结果未按日期升序排列，请重新生成。");
    if (missing.length || unexpected.length || actual.length !== expected.length) {
      const details = [
        missing.length ? `缺少：${missing.join("、")}` : "",
        unexpected.length ? `越界：${unexpected.join("、")}` : "",
      ].filter(Boolean).join("；");
      throw new Error(`LLM 调整结果没有完整覆盖剩余计划日期${details ? `（${details}）` : ""}。`);
    }
    for (const item of milestones) {
      if (!String(item.goal || "").trim()) throw new Error(`LLM 调整结果中 ${item.date} 缺少明确目标。`);
      if (!Array.isArray(item.deliverables)) throw new Error(`LLM 调整结果中 ${item.date} 的 deliverables 格式无效。`);
      if (!Array.isArray(item.taskEstimates)) throw new Error(`LLM 调整结果中 ${item.date} 的 taskEstimates 格式无效。`);
      const isRestDay = /休息|缓冲|空白|不工作/.test(String(item.goal || ""));
      if (item.planningMode === "explicit" && item.estimatedMinutes !== null && !isRestDay && !item.taskEstimates.length) {
        throw new Error(`LLM 调整结果中 ${item.date} 的任务缺少时间预估，请重新生成。`);
      }
      if (item.taskEstimates.some((task) => !task.title || !Number.isInteger(task.estimatedMinutes) || task.estimatedMinutes <= 0)) {
        throw new Error(`LLM 调整结果中 ${item.date} 包含无效的任务时间预估。`);
      }
      const total = item.taskEstimates.reduce((sum, task) => sum + task.estimatedMinutes, 0);
      if (item.taskEstimates.length && item.estimatedMinutes !== total) throw new Error(`LLM 调整结果中 ${item.date} 的总时间预估不一致。`);
    }
    return true;
  }

  async function decomposePhasePlan(planInput, configInput) {
    const config = configInput || await getConfig();
    const plan = { ...planInput, planId: phasePlanId(planInput) };
    if (!/^\d{4}-\d{2}-\d{2}$/.test(plan.startDate || "") ||
        !/^\d{4}-\d{2}-\d{2}$/.test(plan.endDate || "") || plan.endDate < plan.startDate) {
      throw new Error("阶段计划的开始和结束日期无效。");
    }
    if (!String(plan.description || plan.goals || "").trim()) throw new Error("请填写阶段计划描述。");
    const overlaps = await loadPhasePlansInRange(plan.startDate, plan.endDate, config);
    const conflict = overlaps.find((item) => item.id !== plan.id && item.planId !== plan.planId);
    if (conflict) {
      throw new Error(`阶段计划与“${conflict.title}”（${conflict.startDate} 至 ${conflict.endDate}）时间重叠，请先调整日期范围。`);
    }
    const planningProfile = await loadPlanningProfile(config);
    const result = await callLlm("phase_plan.decompose", { plan, planningProfile }, config);
    if (result.status === "blocked") {
      throw new Error(result.blockedReason || result.questions?.join("；") || "阶段计划信息不足，LLM 无法拆分。");
    }
    const milestones = Array.isArray(result.milestones) ? result.milestones : [];
    validateAdjustedMilestones(milestones, plan.startDate, plan.endDate);
    const finalPlan = { ...plan, title: result.planTitle || plan.title || `${plan.startDate} 阶段计划`, milestones };
    const saved = await savePhasePlan(finalPlan, config);
    const persistedPlan = { ...finalPlan, ...saved };
    await syncPhasePlanBindings(persistedPlan, persistedPlan.endDate, config);
    return { ...result, plan: persistedPlan };
  }

  async function adjustPhasePlan(planInput, instruction, configInput) {
    const config = configInput || await getConfig();
    const text = String(instruction || "").trim() || "请根据当前真实进度、时间投入和剩余容量，合理重排剩余阶段计划。";
    const today = localDateKey(new Date());
    const plan = planInput?.id ? planInput : await loadPhasePlan(today, config);
    if (!plan) throw new Error("没有可调整的阶段计划。");
    if (today > plan.endDate) throw new Error("调整后的结束日期不能早于今天。");
    const records = (await loadAllLocalRecords()).filter((record) => record.dateKey >= plan.startDate && record.dateKey <= today && !record.autoFilled);
    const dailyContext = [];
    for (let dateKey = plan.startDate; dateKey <= plan.endDate; dateKey = addDaysToDateKey(dateKey, 1)) {
      const [todos, review] = await Promise.all([loadDailyTodos(dateKey, config), loadDailyReview(dateKey, config)]);
      dailyContext.push({ date: dateKey, todos, review });
    }
    const planningProfile = await loadPlanningProfile(config);
    const result = await callLlm("phase_plan.adjust", { today, instruction: text, plan, records, dailyContext, planningProfile }, config);
    if (result.status === "blocked") throw new Error(result.blockedReason || "当前信息不足，无法调整阶段计划。");
    const remainingStart = today < plan.startDate ? plan.startDate : today;
    validateAdjustedMilestones(result.milestones, remainingStart, plan.endDate);
    const past = (plan.milestones || []).filter((item) => item.date < today);
    const remaining = result.milestones;
    const updated = {
      ...plan,
      // Keep the stable name and planId so historical Notion links remain valid.
      title: plan.title,
      milestones: [...past, ...remaining],
      adjustments: [...(plan.adjustments || []), { at: new Date().toISOString(), instruction: text, summary: result.changeSummary }],
    };
    const saved = await savePhasePlan(updated, config);
    const finalPlan = { ...updated, ...saved };
    await syncPhasePlanBindings(finalPlan, plan.previousEndDate || plan.endDate, config);
    return { ...result, plan: finalPlan };
  }

  async function endPhasePlanEarly(planInput, requestedEndDate, note, configInput) {
    const config = configInput || await getConfig();
    const plan = planInput?.id ? planInput : null;
    if (!plan?.id) throw new Error("阶段计划无效。");
    const endDate = String(requestedEndDate || "").slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(endDate) || endDate < plan.startDate) {
      throw new Error("提前结束日期不能早于阶段计划的开始日期。");
    }
    if (endDate >= plan.endDate) throw new Error("提前结束日期必须早于当前结束日期。");
    const explanation = String(note || "").trim();
    const updated = {
      ...plan,
      endDate,
      previousEndDate: plan.endDate,
      status: "completed",
      milestones: (plan.milestones || []).filter((item) => item.date <= endDate),
      adjustments: [
        ...(plan.adjustments || []),
        {
          at: new Date().toISOString(),
          instruction: explanation,
          summary: `用户将阶段计划提前结束于 ${endDate}${explanation ? `：${explanation}` : ""}`,
          type: "ended_early",
        },
      ],
    };
    const saved = await savePhasePlan(updated, config);
    const finalPlan = { ...updated, ...saved };
    await syncPhasePlanBindings(finalPlan, plan.endDate, config);
    return { plan: finalPlan, endedEarly: true };
  }

  async function syncPhasePlanBindings(plan, previousEndDate, configInput, previousStartDate) {
    const config = configInput || await getConfig();
    const rangeEnd = [plan.endDate, previousEndDate].filter(Boolean).sort().pop() || plan.endDate;
    const rangeStart = [plan.startDate, previousStartDate].filter(Boolean).sort()[0] || plan.startDate;
    const syncSource = async (sourceId) => {
      if (!sourceId) return;
      const source = await resolveDataSource(sourceId, config);
      const dateProperty = findProperty(source.properties, PROPERTY_ALIASES.date, ["date"]);
      const planIdProperty = findProperty(source.properties, PROPERTY_ALIASES.phasePlanLinkId, ["rich_text"]);
      const planNameProperty = findProperty(source.properties, PROPERTY_ALIASES.phasePlanName, ["rich_text"]);
      if (!dateProperty || (!planIdProperty && !planNameProperty)) return;
      const rangePages = await queryDataSource(source.id, {
        page_size: 100,
        filter: { and: [
          { property: dateProperty[0], date: { on_or_after: rangeStart } },
          { property: dateProperty[0], date: { on_or_before: rangeEnd } },
        ] },
      }, config);
      const linkedPages = planIdProperty ? await queryDataSource(source.id, {
        page_size: 100,
        filter: { property: planIdProperty[0], rich_text: { equals: plan.planId } },
      }, config) : [];
      const pages = [...new Map([...rangePages, ...linkedPages].map((page) => [page.id, page])).values()];
      for (const page of pages) {
        const dateKey = String(pagePropertyValue(page, PROPERTY_ALIASES.date, ["date"]) || "").slice(0, 10);
        const currentPlanId = String(pagePropertyValue(page, PROPERTY_ALIASES.phasePlanLinkId, ["rich_text"]) || "");
        const inside = dateKey >= plan.startDate && dateKey <= plan.endDate;
        if (!inside && currentPlanId !== plan.planId) continue;
        const properties = {};
        setProperty(properties, planIdProperty, { rich_text: richText(inside ? plan.planId : "") });
        setProperty(properties, planNameProperty, { rich_text: richText(inside ? plan.title : "") });
        await notionRequest(`/pages/${page.id}`, { method: "PATCH", body: JSON.stringify({ properties }) }, config);
        await wait(160);
      }
    };
    await syncSource(config.dailyPlanSourceId);
    await syncSource(config.dailyReviewSourceId);
    await syncSource(config.dailyArchiveSourceId);
    await rewriteQueuedPhasePlanBindings(plan, { previousEndDate, previousStartDate });
  }

  async function rewriteQueuedPhasePlanBindings(plan, options = {}) {
    await withWriteQueueLock(async () => {
      const queue = await getQueuedWrites();
      let changed = false;
      for (const operation of queue) {
        if (operation.kind !== "todo_upsert" || !operation.payload?.todo) continue;
        const dateKey = String(operation.payload.dateKey || operation.payload.todo.date || "");
        const todo = operation.payload.todo;
        const currentlyLinked = todo.phasePlanId === plan.planId;
        const inside = !options.remove && dateKey >= plan.startDate && dateKey <= plan.endDate;
        if (!inside && !currentlyLinked) continue;
        const nextPlanId = inside ? plan.planId : "";
        const nextPlanName = inside ? plan.title : "";
        if (todo.phasePlanId === nextPlanId && todo.phasePlanName === nextPlanName) continue;
        operation.payload.todo = { ...todo, phasePlanId: nextPlanId, phasePlanName: nextPlanName };
        operation.updatedAt = new Date().toISOString();
        changed = true;
      }
      if (changed) await storageSet({ [WRITE_QUEUE_KEY]: queue });
    });
  }

  async function summarizePhasePlan(planInput, configInput) {
    const config = configInput || await getConfig();
    const plan = planInput;
    if (!plan?.id) throw new Error("阶段计划无效。");
    if (plan.finalSummary) return { skipped: true, plan };
    const records = (await loadAllLocalRecords()).filter((record) => record.dateKey >= plan.startDate && record.dateKey <= plan.endDate && !record.autoFilled);
    const dailyContext = [];
    for (let dateKey = plan.startDate; dateKey <= plan.endDate; dateKey = addDaysToDateKey(dateKey, 1)) {
      const [todos, review] = await Promise.all([loadDailyTodos(dateKey, config), loadDailyReview(dateKey, config)]);
      dailyContext.push({ date: dateKey, todos, review });
    }
    const now = new Date();
    const dailyStatistics = dailyContext.map(({ date, todos }) => {
      const dayRecords = records.filter((record) => record.dateKey === date);
      const totalMinutes = dayRecords.reduce((sum, record) => sum + archiveRecordMinutes(record, now), 0);
      const workMinutes = dayRecords.filter((record) => record.type === "work")
        .reduce((sum, record) => sum + archiveRecordMinutes(record, now), 0);
      const done = todos.filter((todo) => todo.status === "done").length;
      const inProgress = todos.filter((todo) => todo.status === "in_progress").length;
      const pending = todos.filter((todo) => todo.status === "pending").length;
      return {
        date,
        totalMinutes,
        workMinutes,
        todoCount: todos.length,
        done,
        inProgress,
        pending,
        completionRate: todos.length ? Math.round((done / todos.length) * 100) : null,
        todoTime: todos.map((todo) => ({
          title: todo.title,
          status: todo.status,
          actualMinutes: Math.max(0, Number(todo.actualMinutes) || 0),
          actualPomodoros: Math.max(0, Number(todo.actualPomodoros) || 0),
        })),
      };
    });
    const statistics = {
      totalMinutes: dailyStatistics.reduce((sum, day) => sum + day.totalMinutes, 0),
      workMinutes: dailyStatistics.reduce((sum, day) => sum + day.workMinutes, 0),
      todoCount: dailyStatistics.reduce((sum, day) => sum + day.todoCount, 0),
      doneTodoCount: dailyStatistics.reduce((sum, day) => sum + day.done, 0),
      daily: dailyStatistics,
    };
    const result = await callLlm("phase_plan.summarize", { plan, records, dailyContext, statistics, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, asOf: now.toISOString() }, config);
    if (result.status === "blocked") throw new Error(result.blockedReason || "无法生成阶段总结。");
    const finalSummary = [
      result.phaseSummary,
      result.achievementSummary && `完成情况：${result.achievementSummary}`,
      result.timeAnalysis && `时间分析：${result.timeAnalysis}`,
      result.unfinishedItems?.length && `未完成：${result.unfinishedItems.join("；")}`,
      result.lessons?.length && `经验：${result.lessons.join("；")}`,
      result.nextSuggestions?.length && `后续建议：${result.nextSuggestions.join("；")}`,
    ].filter(Boolean).join("\n");
    const saved = await savePhasePlan({ ...plan, finalSummary, summaryGeneratedAt: new Date().toISOString(), status: "completed" }, config);
    return { ...result, plan: { ...plan, ...saved, finalSummary, status: "completed" } };
  }

  async function summarizeExpiredPhasePlans(configInput) {
    const config = configInput || await getConfig();
    const today = localDateKey(new Date());
    const plans = await loadPhasePlansInRange("2000-01-01", today, config);
    const due = plans.filter((plan) => plan.endDate < today && !plan.finalSummary).slice(0, 3);
    for (const plan of due) await summarizePhasePlan(plan, config);
    return { summarized: due.length };
  }

  async function previewTodoAdjustment(dateKey, instruction, configInput, options = {}) {
    const config = configInput || await getConfig();
    const text = String(instruction || "").trim();
    if (!text) throw new Error("请填写希望如何调整待办。");
    const phasePlan = await loadPhasePlan(dateKey, config);
    if (!phasePlan) throw new Error(`没有覆盖 ${dateKey} 的阶段计划，请先创建或更新阶段计划。`);
    const [todos, planningProfile] = await Promise.all([
      loadDailyTodos(dateKey, config), loadPlanningProfile(config),
    ]);
    const manualWindow = manualPlanningWindow(
      dateKey,
      options.requestedAt,
      planningProfile,
      options.preparationMinutes,
      { allowEmptyWindows: true }
    );
    const protectedTodos = todos.filter((todo) => todo.status === "done");
    const protectedKeys = new Set(protectedTodos.flatMap((todo) => [todo.id, todo.externalId]).filter(Boolean));
    const protectedTitles = new Set(protectedTodos.map((todo) => String(todo.title || "").trim().toLowerCase()).filter(Boolean));
    const adjustableTodos = todos.filter((todo) => !protectedKeys.has(todo.id) && !protectedKeys.has(todo.externalId));
    const requiredRescheduleTodos = manualWindow ? adjustableTodos.filter((todo) => {
      const start = scheduleParts(todo.plannedStart);
      return Boolean(start && start.date === dateKey && start.minutes < manualWindow.earliestMinutes);
    }) : [];
    const result = await callLlm("daily_todo.adjust", {
      date: dateKey,
      instruction: text,
      phasePlan,
      dayMilestone: milestoneForDate(phasePlan, dateKey),
      planningProfile,
      todos,
      protectedTodos,
      adjustableTodos,
      requiredRescheduleTodos,
      requestedAt: manualWindow?.requestedAt || null,
      preparationMinutes: manualWindow?.preparationMinutes || 0,
      earliestStart: manualWindow?.earliestStart || null,
      availableWindows: manualWindow?.availableWindows || null,
    }, config);
    if (result.status === "blocked") throw new Error(result.blockedReason || "当前信息不足，无法调整待办。");
    const matchesExisting = (todo, item) =>
      (todo.id && (item.id === todo.id || item.externalId === todo.id)) ||
      (todo.externalId && item.externalId === todo.externalId) ||
      item.title.trim().toLowerCase() === String(todo.title || "").trim().toLowerCase();
    const adjustableKeys = new Set(adjustableTodos.flatMap((todo) => [todo.id, todo.externalId]).filter(Boolean));
    result.deletedTodoIds = (result.deletedTodoIds || []).filter((id) => adjustableKeys.has(id));
    result.deletedTodos = adjustableTodos.filter((todo) =>
      result.deletedTodoIds.includes(todo.id) || result.deletedTodoIds.includes(todo.externalId)
    ).map((todo) => ({ id: todo.id, title: todo.title }));
    const validateCandidates = (candidateTodos) => {
      const preserved = todos.filter((item) =>
        !result.deletedTodoIds.some((id) => item.id === id || item.externalId === id) &&
        !candidateTodos.some((todo) => matchesExisting(todo, item))
      );
      const unresolved = requiredRescheduleTodos.filter((item) =>
        !result.deletedTodoIds.some((id) => item.id === id || item.externalId === id) &&
        !candidateTodos.some((todo) => matchesExisting(todo, item))
      );
      if (unresolved.length) {
        throw new Error(`以下未完成待办的原定时间已过，必须重新安排：${unresolved.map((item) => item.title).join("、")}。`);
      }
      validateManualStartBoundary(candidateTodos, manualWindow);
      validateTodoChangesAgainstExisting(dateKey, candidateTodos, preserved, planningProfile, { allowWorkWindowOverrides: true });
    };
    let candidates = (Array.isArray(result.todos) ? result.todos : [])
      .filter((todo) => !protectedKeys.has(todo.id) && !protectedKeys.has(todo.externalId))
      .filter((todo) => !protectedTitles.has(String(todo.title || "").trim().toLowerCase()));
    try {
      validateCandidates(candidates);
    } catch (validationError) {
      const repair = await callLlm("daily_todo.adjust_repair", {
        date: dateKey,
        instruction: text,
        phasePlan,
        dayMilestone: milestoneForDate(phasePlan, dateKey),
        deletedTodoIds: result.deletedTodoIds,
        earliestStart: manualWindow?.earliestStart || null,
        currentTime: manualWindow?.earliestStart || options.requestedAt,
        availableWindows: manualWindow?.availableWindows || null,
        planningProfile,
        protectedTodos,
        todos,
        adjustableTodos,
        requiredRescheduleTodos,
        candidateTodos: candidates,
        validationError: validationError.message,
      }, config);
      if (repair.status === "blocked") throw new Error(repair.blockedReason || "LLM 无法修正待办时间。");
      result.deletedTodoIds = [...new Set([...(result.deletedTodoIds || []), ...(repair.deletedTodoIds || [])])]
        .filter((id) => adjustableKeys.has(id));
      result.deletedTodos = adjustableTodos.filter((todo) =>
        result.deletedTodoIds.includes(todo.id) || result.deletedTodoIds.includes(todo.externalId)
      ).map((todo) => ({ id: todo.id, title: todo.title }));
      candidates = (Array.isArray(repair.todos) ? repair.todos : [])
        .filter((todo) => !protectedKeys.has(todo.id) && !protectedKeys.has(todo.externalId))
        .filter((todo) => !protectedTitles.has(String(todo.title || "").trim().toLowerCase()));
      try {
        validateCandidates(candidates);
      } catch (repairError) {
        throw new Error(`LLM 已自动修正一次，但时间仍不合法：${repairError.message}本次未写入 Notion。`);
      }
      result.changeSummary = repair.changeSummary || result.changeSummary;
      result.warnings = [...(result.warnings || []), ...(repair.warnings || [])];
    }
    result.todos = candidates;
    const weekday = new Date(`${dateKey}T12:00:00`).getDay();
    const windows = normalizePlanningProfile(planningProfile).workWindows.filter((window) => window.weekdays.includes(weekday));
    const overrideWarnings = candidates.filter((todo) => {
      const start = scheduleParts(todo.plannedStart), end = scheduleParts(todo.plannedEnd);
      return todo.workWindowOverride && start && end && !windows.some((window) => {
        const range = blockMinutes(window);
        return start.minutes >= range.start && end.minutes <= range.end;
      });
    }).map((todo) => `“${todo.title}”按用户要求安排在常规工作窗口外。`);
    result.warnings = [...new Set([...(result.warnings || []), ...overrideWarnings])];
    result.baseVersions = Object.fromEntries(todos.map((todo) => [todo.id, todo.lastEditedTime || ""]));
    result.earliestStart = manualWindow?.earliestStart || null;
    return result;
  }

  async function applyTodoAdjustment(dateKey, todos, instruction, configInput, options = {}) {
    const config = configInput || await getConfig();
    const existing = await loadDailyTodos(dateKey, config);
    const baseVersions = options.baseVersions || {};
    const requestedDeletes = new Set((options.deletedTodoIds || []).filter(Boolean));
    const matchesExisting = (todo, item) =>
      (todo.id && (item.id === todo.id || item.externalId === todo.id)) ||
      (todo.externalId && item.externalId === todo.externalId) ||
      item.title.trim().toLowerCase() === String(todo.title || "").trim().toLowerCase();
    const matchedPageIds = new Set();
    const incoming = (Array.isArray(todos) ? todos : []).map((todo) => {
      const match = existing.find((item) => matchesExisting(todo, item));
      if (!match && todo.id && baseVersions[todo.id]) {
        const error = new Error(`待办“${todo.title || "未命名"}”在生成预览后已从 Notion 中删除、归档或失去访问权限，请重新生成调整预览。`);
        error.code = "todo_revision_conflict";
        throw error;
      }
      if (match && baseVersions[match.id] && match.lastEditedTime && baseVersions[match.id] !== match.lastEditedTime) {
        const error = new Error(`待办“${match.title}”在预览后已发生变化，请重新生成调整预览。`);
        error.code = "todo_revision_conflict";
        throw error;
      }
      // Completion is the only immutable state. Delayed, running and manually
      // created unfinished items may all be rescheduled by an explicit LLM adjustment.
      if (match?.status === "done") return null;
      if (match) matchedPageIds.add(match.id);
      return {
        ...match,
        ...todo,
        // Only reuse an ID that was confirmed by the fresh Notion query. An
        // unmatched model-supplied ID may point to an archived/deleted page.
        id: match?.id,
        externalId: match?.externalId || todo.externalId,
        adjustmentNote: todo.adjustmentNote || instruction,
        origin: todo.origin || "llm",
      };
    }).filter(Boolean);
    const deletions = existing.filter((item) =>
      (requestedDeletes.has(item.id) || requestedDeletes.has(item.externalId)) &&
      item.status !== "done" && !matchedPageIds.has(item.id)
    );
    for (const item of deletions) {
      if (baseVersions[item.id] && item.lastEditedTime && baseVersions[item.id] !== item.lastEditedTime) {
        const error = new Error(`待办“${item.title}”在预览后已发生变化，未执行删除。`);
        error.code = "todo_revision_conflict";
        throw error;
      }
    }
    const deletionIds = new Set(deletions.map((item) => item.id));
    const preservedItems = existing.filter((item) => !matchedPageIds.has(item.id) && !deletionIds.has(item.id));
    validateTodoChangesAgainstExisting(dateKey, incoming, preservedItems, await loadPlanningProfile(config), {
      allowWorkWindowOverrides: Boolean(String(instruction || "").trim()) && options.allowWorkWindowOverrides !== false,
    });
    // Write new/changed items before performing explicit deletions so a failed
    // write cannot silently destroy the previous plan.
    const writeTotal = incoming.length + deletions.length;
    let writeCurrent = 0;
    const summary = await upsertDailyTodos(dateKey, incoming, config, {
      onProgress: async (detail) => {
        writeCurrent = detail.current;
        await options.onProgress?.({ ...detail, current: writeCurrent, total: writeTotal });
      },
    });
    for (const item of deletions) {
      writeCurrent += 1;
      await options.onProgress?.({
        phase: "writing",
        action: "delete",
        current: writeCurrent,
        total: writeTotal,
        title: item.title,
      });
      await deleteDailyTodo(item.id, config);
      await wait(340);
    }
    summary.deleted = deletions.length;
    summary.total = preservedItems.length + incoming.length;
    return summary;
  }

  async function adjustIntradayTodos(dateKey, runAt, configInput, onProgress) {
    const config = configInput || await getConfig();
    const currentTime = runAt instanceof Date ? runAt : new Date(runAt || Date.now());
    if (Number.isNaN(currentTime.getTime())) throw new Error("日内调整时间无效。");
    await onProgress?.({ phase: "reading", message: "正在读取阶段计划和当日执行数据…" });
    const phasePlan = await loadPhasePlan(dateKey, config);
    if (!phasePlan) return { skipped: true, reason: "phase_plan_missing", date: dateKey };
    const [todos, planningProfile, review, records] = await Promise.all([
      loadDailyTodos(dateKey, config),
      loadPlanningProfile(config),
      loadDailyReview(dateKey, config),
      loadAllLocalRecords().then((items) => items.filter((record) => record.dateKey === dateKey && !record.autoFilled)),
    ]);
    if (!todos.length) return { skipped: true, reason: "todos_missing", date: dateKey };
    const currentIso = currentTime.toISOString();
    const weekday = new Date(`${dateKey}T12:00:00`).getDay();
    const availableWindows = planningProfile.workWindows
      .filter((item) => item.weekdays.includes(weekday) && Date.parse(`${dateKey}T${item.end}:00`) > currentTime.getTime())
      .map((item) => ({
        start: new Date(Math.max(Date.parse(`${dateKey}T${item.start}:00`), currentTime.getTime() + 60 * 1000)).toISOString(),
        end: `${dateKey}T${item.end}:00`,
      }));
    if (!availableWindows.length) return { skipped: true, reason: "workday_finished", date: dateKey };
    const protectedTodos = todos.filter((todo) => todo.status === "done");
    const adjustableTodos = todos.filter((todo) => !protectedTodos.some((item) => item.id === todo.id));
    const adjustableKeys = new Set(adjustableTodos.flatMap((todo) => [todo.id, todo.externalId]).filter(Boolean));
    const requiredRescheduleTodos = adjustableTodos.filter((todo) => {
      const start = Date.parse(todo.plannedStart || "");
      return Number.isFinite(start) && start < currentTime.getTime();
    });
    if (!adjustableTodos.length) return { skipped: true, reason: "nothing_adjustable", date: dateKey };
    await onProgress?.({ phase: "generating", message: "数据已就绪，LLM 正在生成剩余时间安排…" });
    const result = await callLlm("daily_todo.intraday_adjust", {
      date: dateKey,
      currentTime: currentIso,
      phasePlan,
      dayMilestone: milestoneForDate(phasePlan, dateKey),
      planningProfile,
      availableWindows,
      todos,
      userCompletion: review.userCompletion || "",
      protectedTodos,
      adjustableTodos,
      requiredRescheduleTodos,
      records: records.map((record) => ({
        id: stableRecordId(record),
        start: new Date(Number(record.start)).toISOString(),
        end: record.end == null ? null : new Date(Number(record.end)).toISOString(),
        type: record.type,
        title: getRecordTitle(record),
        evaluation: getEvaluation(record),
        note: getRecordNote(record),
        todoId: record.todoId || "",
      })),
    }, config);
    if (result.status === "blocked") {
      const error = new Error(result.blockedReason || result.warnings?.join("；") || "LLM 暂停了日内待办调整。");
      error.code = "llm_blocked";
      throw error;
    }
    result.deletedTodoIds = (result.deletedTodoIds || []).filter((id) => adjustableKeys.has(id));
    const validateCandidateTodos = (candidateTodos) => {
      for (const todo of candidateTodos) {
        if (todo.effortBasis === "unknown") continue;
        const plannedStart = Date.parse(todo.plannedStart || "");
        if (!Number.isFinite(plannedStart) || plannedStart <= currentTime.getTime()) {
          throw new Error(`待办“${todo.title || "未命名"}”没有安排在 ${currentIso} 之后。`);
        }
      }
      const deletedIds = new Set(result.deletedTodoIds || []);
      const preservedAdjustable = adjustableTodos.filter((item) =>
        !deletedIds.has(item.id) && !deletedIds.has(item.externalId) &&
        !candidateTodos.some((todo) =>
          (todo.id && (item.id === todo.id || item.externalId === todo.id)) ||
          (todo.externalId && item.externalId === todo.externalId) ||
          item.title.trim().toLowerCase() === String(todo.title || "").trim().toLowerCase()
        )
      );
      const unresolved = requiredRescheduleTodos.filter((item) =>
        !deletedIds.has(item.id) && !deletedIds.has(item.externalId) &&
        !candidateTodos.some((todo) =>
          (todo.id && (item.id === todo.id || item.externalId === todo.id)) ||
          (todo.externalId && item.externalId === todo.externalId) ||
          item.title.trim().toLowerCase() === String(todo.title || "").trim().toLowerCase()
        )
      );
      if (unresolved.length) {
        throw new Error(`以下未完成待办的原定时间已过，必须重新安排：${unresolved.map((item) => item.title).join("、")}。`);
      }
      validateTodoChangesAgainstExisting(dateKey, candidateTodos, [...protectedTodos, ...preservedAdjustable], planningProfile);
    };
    let incoming = Array.isArray(result.todos) ? result.todos : [];
    const protectedKeys = new Set(protectedTodos.flatMap((todo) => [todo.id, todo.externalId]).filter(Boolean));
    let safeIncoming = incoming.filter((todo) => !protectedKeys.has(todo.id) && !protectedKeys.has(todo.externalId));
    try {
      validateCandidateTodos(safeIncoming);
    } catch (validationError) {
      await onProgress?.({ phase: "repairing", message: `首次结果未通过时间校验，LLM 正在自动修正：${validationError.message}` });
      const repair = await callLlm("daily_todo.intraday_repair", {
        taskVariant: "auto_delta",
        date: dateKey,
        currentTime: currentIso,
        availableWindows,
        planningProfile,
        protectedTodos,
        todos,
        adjustableTodos,
        deletedTodoIds: result.deletedTodoIds,
        phasePlan,
        dayMilestone: milestoneForDate(phasePlan, dateKey),
        requiredRescheduleTodos,
        candidateTodos: safeIncoming,
        validationError: validationError.message,
      }, config);
      if (repair.status === "blocked") throw new Error(repair.blockedReason || "LLM 无法修正日内待办时间。");
      result.deletedTodoIds = [...new Set([...(result.deletedTodoIds || []), ...(repair.deletedTodoIds || [])])]
        .filter((id) => adjustableKeys.has(id));
      incoming = Array.isArray(repair.todos) ? repair.todos : [];
      safeIncoming = incoming.filter((todo) => !protectedKeys.has(todo.id) && !protectedKeys.has(todo.externalId));
      try {
        validateCandidateTodos(safeIncoming);
      } catch (repairError) {
        throw new Error(`LLM 已自动修正一次，但时间仍不合法：${repairError.message}本次未写入 Notion。`);
      }
      result.changeSummary = repair.changeSummary || result.changeSummary;
      result.warnings = [...(result.warnings || []), ...(repair.warnings || [])];
    }
    await onProgress?.({ phase: "writing", message: "LLM 结果已通过校验，正在写入 Notion…" });
    const summary = await applyTodoAdjustment(
      dateKey,
      safeIncoming,
      `${String(currentTime.getHours()).padStart(2, "0")}:${String(currentTime.getMinutes()).padStart(2, "0")} 日内自动调整`,
      config,
      {
        deletedTodoIds: result.deletedTodoIds || [],
        baseVersions: Object.fromEntries(todos.map((todo) => [todo.id, todo.lastEditedTime || ""])),
        allowWorkWindowOverrides: false,
        onProgress,
      }
    );
    return {
      skipped: false,
      date: dateKey,
      runAt: currentIso,
      changeSummary: result.changeSummary || "",
      warnings: result.warnings || [],
      todoSummary: summary,
    };
  }

  async function generateInitialDayTodos(dateKey, configInput, options = {}) {
    const config = configInput || await getConfig();
    const phasePlan = await loadPhasePlan(dateKey, config);
    if (!phasePlan || phasePlan.startDate !== dateKey) {
      const error = new Error(`${dateKey} 不是阶段计划第一天，请使用普通日期待办生成。`);
      error.code = "phase_milestone_required";
      throw error;
    }
    const generated = await generateDayTodos(dateKey, config, {
      phasePlan,
      action: "daily_todo.initial",
      requestedAt: options.requestedAt,
      preparationMinutes: options.preparationMinutes,
    });
    return { ...generated, firstDay: true };
  }

  async function generateDayTodos(dateKey, configInput, options = {}) {
    const config = configInput || await getConfig();
    const phasePlan = options.phasePlan || await loadPhasePlan(dateKey, config);
    if (!phasePlan) {
      const error = new Error(`没有覆盖 ${dateKey} 的阶段计划，请先创建或更新阶段计划。`);
      error.code = "phase_plan_required";
      throw error;
    }
    const existing = await loadDailyTodos(dateKey, config);
    if (existing.length) {
      return { date: dateKey, todoSummary: { total: existing.length, created: 0, updated: 0 }, warnings: [] };
    }
    const dayMilestone = milestoneForDate(phasePlan, dateKey);
    if (!dayMilestone) {
      const error = new Error(`阶段计划尚未包含 ${dateKey} 的每日里程碑。`);
      error.code = "phase_milestone_required";
      throw error;
    }
    const planningProfile = await loadPlanningProfile(config);
    if (dayMilestone.planningMode !== "percentage" && !hasWorkWindowForDate(dateKey, planningProfile)) {
      const error = new Error(`${dateKey} 没有可用工作窗口，请先更新个人节奏。`);
      error.code = "planning_profile_required";
      throw error;
    }
    const action = options.action || "daily_todo.generate";
    const manualWindow = manualPlanningWindow(
      dateKey,
      options.requestedAt,
      planningProfile,
      options.preparationMinutes,
      { allowEmptyWindows: dayMilestone.planningMode === "percentage" }
    );
    const previousDate = addDaysToDateKey(dateKey, -1);
    const [previousTodos, previousReview, previousRecords] = action === "daily_todo.initial"
      ? [[], { userCompletion: "", dailySummary: "", timeAnalysis: "", problemAnalysis: "", nextFocus: "" }, []]
      : await Promise.all([
        loadDailyTodos(previousDate, config),
        loadDailyReview(previousDate, config),
        loadAllLocalRecords().then((records) => records.filter((record) => record.dateKey === previousDate && !record.autoFilled)),
      ]);
    const hasPreviousContext = Boolean(
      previousTodos.length || previousRecords.length || previousReview.userCompletion || previousReview.dailySummary ||
      previousReview.timeAnalysis || previousReview.problemAnalysis || previousReview.nextFocus
    );
    const result = await callLlm(action, {
      date: dateKey,
      phasePlan,
      dayMilestone,
      planningProfile,
      requestedAt: manualWindow?.requestedAt || null,
      preparationMinutes: manualWindow?.preparationMinutes || 0,
      earliestStart: manualWindow?.earliestStart || null,
      availableWindows: manualWindow?.availableWindows || null,
      previousDayContext: hasPreviousContext ? {
        date: previousDate,
        todos: previousTodos,
        records: previousRecords,
        userCompletion: previousReview.userCompletion,
        review: {
          dailySummary: previousReview.dailySummary,
          timeAnalysis: previousReview.timeAnalysis,
          problemAnalysis: previousReview.problemAnalysis,
          nextFocus: previousReview.nextFocus,
        },
      } : null,
    }, config);
    if (result.status === "blocked") {
      const error = new Error(result.blockedReason || result.warnings?.join("；") || "LLM 暂停了待办生成。");
      error.code = "llm_blocked";
      throw error;
    }
    const validateGenerated = (todos) => {
      validateManualStartBoundary(todos, manualWindow);
      validateTodoSchedules(dateKey, todos, planningProfile);
    };
    let generatedTodos = Array.isArray(result.todos) ? result.todos : [];
    try {
      validateGenerated(generatedTodos);
    } catch (validationError) {
      const repair = await callLlm("daily_todo.intraday_repair", {
        taskVariant: action === "daily_todo.initial" ? "initial_generate" : "day_generate",
        date: dateKey,
        earliestStart: manualWindow?.earliestStart || scheduledDateTimeWithLocalOffset(`${dateKey}T00:00:00`),
        availableWindows: manualWindow?.availableWindows || (manualPlanningWindow(dateKey, `${dateKey}T00:00:00`, planningProfile, 0, { allowEmptyWindows: true })?.availableWindows || []),
        phasePlan,
        dayMilestone,
        fixedSchedule: result.fixedSchedule,
        deferredTodos: result.deferredTodos,
        planningProfile,
        protectedTodos: [],
        candidateTodos: generatedTodos,
        validationError: validationError.message,
      }, config);
      if (repair.status === "blocked") throw new Error(repair.blockedReason || "LLM 无法修正待办时间。");
      generatedTodos = Array.isArray(repair.todos) ? repair.todos : [];
      result.fixedSchedule = repair.fixedSchedule;
      result.deferredTodos = repair.deferredTodos;
      try {
        validateGenerated(generatedTodos);
      } catch (repairError) {
        throw new Error(`LLM 已自动修正一次，但时间仍不合法：${repairError.message}本次未写入 Notion。`);
      }
      result.warnings = [...(result.warnings || []), ...(repair.warnings || [])];
    }
    const todoSummary = await upsertDailyTodos(dateKey, generatedTodos.map((todo) => ({
      ...todo,
      phasePlanId: phasePlan.planId,
      phasePlanName: phasePlan.title,
    })), config);
    return {
      date: dateKey,
      todoSummary,
      warnings: result.warnings || [],
      deferredTodos: result.deferredTodos || [],
      usedPreviousContext: hasPreviousContext,
      earliestStart: manualWindow?.earliestStart || null,
    };
  }

  async function triggerDailyReview(dateKey, configInput) {
    const config = configInput || await getConfig();
    const userCompletion = await loadDailyCompletion(dateKey, config);
    if (!userCompletion) {
      const error = new Error("请先填写并保存当天完成情况；未填写时不会调用 LLM。");
      error.code = "completion_required";
      throw error;
    }
    const nextTodoDate = addDaysToDateKey(dateKey, 1);
    const phasePlan = await loadPhasePlan(nextTodoDate, config);
    const currentPhasePlan = await loadPhasePlan(dateKey, config);
    const nextDayMilestone = phasePlan ? milestoneForDate(phasePlan, nextTodoDate) : null;
    const records = (await loadAllLocalRecords()).filter((record) => record.dateKey === dateKey && !record.autoFilled);
    const [todos, planningProfile, existingNextTodos] = await Promise.all([
      loadDailyTodos(dateKey, config),
      loadPlanningProfile(config),
      loadDailyTodos(nextTodoDate, config),
    ]);
    const nextTodoBlockedReason = !phasePlan
      ? `阶段计划未覆盖 ${nextTodoDate}`
      : !nextDayMilestone
        ? `阶段计划没有 ${nextTodoDate} 的每日里程碑`
        : nextDayMilestone.planningMode !== "percentage" && !hasWorkWindowForDate(nextTodoDate, planningProfile)
          ? `${nextTodoDate} 没有可用工作窗口`
          : "";
    let generateNextTodos = !nextTodoBlockedReason;
    let nextTodoSkipReason = nextTodoBlockedReason;
    const payload = {
      date: dateKey,
      nextTodoDate,
      operationId: `daily-review:${dateKey}`,
      generateNextTodos,
      nextTodoBlockedReason,
      timezone: planningProfile.timezone,
      userCompletion,
      phasePlan,
      currentPhasePlan,
      statistics: {
        totalMinutes: records.reduce((n,r) => n + Math.max(0, (Number(r.end ?? Date.now()) - Number(r.start)) / 60000), 0),
        workMinutes: records.filter(r=>r.type === "work").reduce((n,r) => n + Math.max(0, (Number(r.end ?? Date.now()) - Number(r.start)) / 60000), 0),
        todoCount: todos.length,
        doneTodoCount: todos.filter(t=>t.status === "done").length,
      },
      nextDayMilestone,
      planningProfile,
      todos,
      existingNextTodos,
      records: records.map((record) => ({
        id: stableRecordId(record),
        start: new Date(Number(record.start)).toISOString(),
        end: record.end == null ? null : new Date(Number(record.end)).toISOString(),
        type: record.type,
        title: getRecordTitle(record),
        evaluation: getEvaluation(record),
        note: getRecordNote(record),
        todoId: record.todoId || "",
      })),
    };
    const result = await callLlm("daily_review.generate", payload, config);
    if (result.status === "blocked") {
      const error = new Error(result.blockedReason || result.warnings?.join("；") || "LLM 暂停了本次生成。");
      error.code = "llm_blocked";
      throw error;
    }
    const review = result.review || result;
    const nextDayTodos = !generateNextTodos ? [] : Array.isArray(result.nextDayTodos)
      ? result.nextDayTodos
      : Array.isArray(review.nextDayTodos) ? review.nextDayTodos : [];
    const existingNextKeys = new Set(existingNextTodos.flatMap((todo) => [
      todo.id, todo.externalId, todo.title.trim().toLowerCase(),
    ]).filter(Boolean));
    let safeNextDayTodos = nextDayTodos.filter((todo) =>
      !existingNextKeys.has(String(todo?.id || "")) &&
      !existingNextKeys.has(String(todo?.externalId || "")) &&
      !existingNextKeys.has(String(todo?.title || "").trim().toLowerCase())
    );
    if (safeNextDayTodos.length !== nextDayTodos.length) {
      result.warnings = [...(result.warnings || []), "LLM 返回了与次日现有待办重复的项目，插件已保留原记录并忽略重复项。"];
    }
    try {
      validateTodoSchedules(nextTodoDate, safeNextDayTodos, planningProfile);
      const occupiedRanges = existingNextTodos.map((todo) => ({
        todo,
        start: scheduleParts(todo.plannedStart),
        end: scheduleParts(todo.plannedEnd),
      })).filter((item) => item.start && item.end);
      for (const todo of safeNextDayTodos) {
        const start = scheduleParts(todo.plannedStart);
        const end = scheduleParts(todo.plannedEnd);
        const conflict = occupiedRanges.find((item) =>
          start && end && start.minutes < item.end.minutes && end.minutes > item.start.minutes
        );
        if (conflict) throw new Error(`待办“${todo.title}”与次日现有待办“${conflict.todo.title}”时间重叠。`);
      }
    } catch (error) {
      generateNextTodos = false;
      nextTodoSkipReason = `次日待办校验失败：${error.message}`;
      safeNextDayTodos = [];
    }
    if (!generateNextTodos) {
      result.warnings = [...(result.warnings || []), `${nextTodoSkipReason}，已保留当日总结并跳过次日待办。`];
    }
    // Persist the irreplaceable review first. If todo creation fails later, a
    // retry can safely reuse deterministic todo IDs without losing the review.
    if (config.dailyReviewSourceId && (review.dailySummary || review.summary)) {
      await writeDailyReview(dateKey, {
        ...review,
        phasePlanId: currentPhasePlan?.planId || "",
        phasePlanName: currentPhasePlan?.title || "",
      }, config);
    }
    const todoSummary = generateNextTodos
      ? await upsertDailyTodos(nextTodoDate, safeNextDayTodos.map((todo) => ({
          ...todo,
          phasePlanId: phasePlan.planId,
          phasePlanName: phasePlan.title,
        })), config)
      : { total: 0, created: 0, updated: 0, skipped: true, reason: nextTodoSkipReason };
    let archive = null;
    let archiveError = "";
    if (config.dailyArchiveSourceId && (review.dailySummary || review.summary)) {
      try {
        // Use the result already returned by the LLM for this first archive.
        // Notion data-source queries can lag briefly behind a page update, so
        // immediately querying the new Daily Review could otherwise produce a
        // false "summary missing" error.
        archive = await generateDailyArchive(dateKey, config, {
          review: {
            ...review,
            userCompletion,
            phasePlanId: currentPhasePlan?.planId || "",
            phasePlanName: currentPhasePlan?.title || "",
          },
          phasePlan: currentPhasePlan || phasePlan,
        });
      } catch (error) {
        archiveError = error?.message || String(error);
      }
    }
    return {
      payload,
      result,
      wroteToNotion: Boolean(config.dailyReviewSourceId && (review.dailySummary || review.summary)),
      todoSummary,
      nextTodoDate,
      nextTodoSkipped: !generateNextTodos,
      nextTodoBlockedReason: nextTodoSkipReason,
      archive,
      archiveError,
    };
  }

  function archiveInlineText(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function archiveClock(value) {
    if (!value) return "--:--";
    const literal = String(value).match(/T(\d{2}):(\d{2})/);
    const hasExplicitZone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(String(value));
    if (hasExplicitZone) {
      const parsed = new Date(value);
      if (!Number.isNaN(parsed.getTime())) {
        return `${String(parsed.getHours()).padStart(2, "0")}:${String(parsed.getMinutes()).padStart(2, "0")}`;
      }
    }
    if (literal) return `${literal[1]}:${literal[2]}`;
    const parsed = new Date(Number(value));
    if (Number.isNaN(parsed.getTime())) return "--:--";
    return `${String(parsed.getHours()).padStart(2, "0")}:${String(parsed.getMinutes()).padStart(2, "0")}`;
  }

  function archiveRecordMinutes(record, generatedAt) {
    const start = Number(record?.start);
    const end = record?.end == null ? generatedAt.getTime() : Number(record.end);
    return Number.isFinite(start) && Number.isFinite(end) && end > start
      ? Math.max(0, Math.round((end - start) / 60000))
      : 0;
  }

  async function buildDailyArchiveData(dateKey, configInput, options = {}) {
    const config = configInput || await getConfig();
    const generatedAt = new Date();
    const [todos, storedReview, storedPhasePlan, allRecords] = await Promise.all([
      loadDailyTodos(dateKey, config),
      loadDailyReview(dateKey, config),
      loadPhasePlan(dateKey, config),
      loadAllLocalRecords(),
    ]);
    const review = options.review ? { ...storedReview, ...options.review } : storedReview;
    const localLife = (await storageGet(`minimalPomodoroLifeRecords:${dateKey}`))[`minimalPomodoroLifeRecords:${dateKey}`];
    const lifeRecord = localLife?.pendingSync ? localLife.text : review.lifeRecord?.text ?? localLife?.text ?? "";
    const phasePlan = options.phasePlan || storedPhasePlan;
    const records = allRecords
      .filter((record) => record.dateKey === dateKey && !record.autoFilled)
      .sort((left, right) => Number(left.start) - Number(right.start));
    const totalMinutes = records.reduce((sum, record) => sum + archiveRecordMinutes(record, generatedAt), 0);
    const workMinutes = records.filter((record) => record.type === "work")
      .reduce((sum, record) => sum + archiveRecordMinutes(record, generatedAt), 0);
    const pomodoroCount = todos.reduce((sum, todo) => sum + Math.max(0, Number(todo.actualPomodoros) || 0), 0);
    return {
      date: dateKey,
      generatedAt: generatedAt.toISOString(),
      phasePlan,
      dayMilestone: milestoneForDate(phasePlan, dateKey),
      todos: [...todos].sort((left, right) => String(left.plannedStart || "").localeCompare(String(right.plannedStart || ""))),
      records,
      review,
      lifeRecord,
      metrics: {
        totalMinutes,
        workMinutes,
        todoCount: todos.length,
        completedTodoCount: todos.filter((todo) => todo.status === "done").length,
        pomodoroCount: Math.round(pomodoroCount),
      },
    };
  }

  function buildDailyArchiveMarkdown(data) {
    const statusLabel = { done: "已完成", in_progress: "进行中", pending: "待开始" };
    const typeLabel = { work: "工作", break: "休息", life: "生活", entertainment: "娱乐" };
    const milestoneTasks = Array.isArray(data.dayMilestone?.taskEstimates) ? data.dayMilestone.taskEstimates : [];
    const lines = [
      `# ${data.date} 每日记录`,
      "",
      `> 生成时间：${new Date(data.generatedAt).toLocaleString("zh-CN", { hour12: false })}`,
      `> 阶段计划：${archiveInlineText(data.phasePlan?.title || "未绑定")}`,
      `> 总投入：${data.metrics.totalMinutes} 分钟 · 工作投入：${data.metrics.workMinutes} 分钟 · 待办：${data.metrics.completedTodoCount}/${data.metrics.todoCount} · 番茄：${data.metrics.pomodoroCount}`,
      "",
      "## 当日阶段计划",
      "",
      data.dayMilestone?.goal ? archiveInlineText(data.dayMilestone.goal) : "当天没有绑定阶段里程碑。",
    ];
    for (const task of data.dayMilestone?.taskProgress || []) {
      lines.push(`- ${archiveInlineText(task.title)}：累计预期 ${task.targetProgressPercent}%（非实际进度）`);
    }
    if (milestoneTasks.length) {
      lines.push("", ...milestoneTasks.map((task) =>
        `- ${archiveInlineText(task.title)}（预计 ${Math.max(0, Number(task.estimatedMinutes) || 0)} 分钟）${task.deliverable ? `：${archiveInlineText(task.deliverable)}` : ""}`
      ));
    }
    lines.push("", "## 当日待办", "");
    if (data.todos.length) {
      for (const todo of data.todos) {
        const checked = todo.status === "done" ? "x" : " ";
        const schedule = todo.plannedStart && todo.plannedEnd
          ? `${archiveClock(todo.plannedStart)}–${archiveClock(todo.plannedEnd)}`
          : "未安排时间";
        const effort = todo.estimatedPomodoros == null ? "投入未知" : `预计 ${todo.estimatedPomodoros} 个番茄`;
        const target = Number.isFinite(todo.targetProgressPercent) ? ` · 累计预期目标 ${todo.targetProgressPercent}%（非实际进度）` : "";
        lines.push(`- [${checked}] ${archiveInlineText(todo.title)} · ${schedule} · ${statusLabel[todo.status] || todo.status || "待开始"} · ${effort}${target} · 实际投入 ${todo.actualMinutes || 0} 分钟`);
        if (todo.details) lines.push(`  - 说明：${archiveInlineText(todo.details)}`);
      }
    } else {
      lines.push("当天没有待办。");
    }
    lines.push("", "## 时间流", "");
    if (data.records.length) {
      for (const record of data.records) {
        const minutes = archiveRecordMinutes(record, new Date(data.generatedAt));
        lines.push(`- ${archiveClock(record.start)}–${archiveClock(record.end)} · ${typeLabel[record.type] || record.type || "记录"} · ${archiveInlineText(getRecordTitle(record))} · ${minutes} 分钟`);
        const detail = [getEvaluation(record), getRecordNote(record)].filter(Boolean).join("；");
        if (detail) lines.push(`  - ${archiveInlineText(detail)}`);
      }
    } else {
      lines.push("当天没有时间记录。");
    }
    lines.push(
      "", "## 用户填写的完成情况", "",
      data.review.userCompletion || "尚未填写完成情况。",
      "", "## 生活记录", "",
      data.lifeRecord || "尚未填写生活记录。",
      "", "## LLM 当天总结", "",
      data.review.dailySummary || data.review.summary || "尚未生成当天总结。",
      "", "## 时间分析", "",
      data.review.timeAnalysis || "暂无时间分析。",
      "", "## 问题与阻碍", "",
      data.review.problemAnalysis || "暂无问题分析。",
      "", "## 次日关注点", "",
      data.review.nextFocus || "暂无次日关注点。",
      ""
    );
    return lines.join("\n");
  }

  function archiveTextBlock(type, text) {
    return {
      object: "block",
      type,
      [type]: { rich_text: richTextLong(text || " ") },
    };
  }

  function buildDailyArchiveBlocks(data) {
    const blocks = [
      archiveTextBlock("heading_1", `${data.date} 每日记录`),
      archiveTextBlock("paragraph", `阶段计划：${data.phasePlan?.title || "未绑定"}`),
      archiveTextBlock("paragraph", `总投入 ${data.metrics.totalMinutes} 分钟 · 工作投入 ${data.metrics.workMinutes} 分钟 · 待办 ${data.metrics.completedTodoCount}/${data.metrics.todoCount} · 番茄 ${data.metrics.pomodoroCount}`),
      { object: "block", type: "divider", divider: {} },
      archiveTextBlock("heading_2", "当日阶段计划"),
      archiveTextBlock("paragraph", data.dayMilestone?.goal || "当天没有绑定阶段里程碑。"),
    ];
    for (const task of data.dayMilestone?.taskProgress || []) {
      blocks.push(archiveTextBlock("bulleted_list_item", `${task.title}：累计预期 ${task.targetProgressPercent}%（非实际进度）`));
    }
    for (const task of data.dayMilestone?.taskEstimates || []) {
      blocks.push(archiveTextBlock("bulleted_list_item", `${task.title}（预计 ${task.estimatedMinutes || 0} 分钟）${task.deliverable ? `：${task.deliverable}` : ""}`));
    }
    blocks.push(archiveTextBlock("heading_2", "当日待办"));
    if (data.todos.length) {
      for (const todo of data.todos) {
        blocks.push({
          object: "block",
          type: "to_do",
          to_do: {
            checked: todo.status === "done",
            rich_text: richTextLong(`${todo.title} · ${todo.plannedStart ? `${archiveClock(todo.plannedStart)}–${archiveClock(todo.plannedEnd)}` : "尚未排程"} · ${todo.estimatedPomodoros == null ? "投入未知" : `预计 ${todo.estimatedPomodoros} 个番茄`}${Number.isFinite(todo.targetProgressPercent) ? ` · 累计预期目标 ${todo.targetProgressPercent}%（非实际进度）` : ""} · 实际投入 ${todo.actualMinutes || 0} 分钟`),
          },
        });
      }
    } else blocks.push(archiveTextBlock("paragraph", "当天没有待办。"));
    blocks.push(archiveTextBlock("heading_2", "时间流"));
    if (data.records.length) {
      for (const record of data.records) {
        blocks.push(archiveTextBlock("bulleted_list_item", `${archiveClock(record.start)}–${archiveClock(record.end)} · ${getRecordTitle(record)} · ${archiveRecordMinutes(record, new Date(data.generatedAt))} 分钟`));
      }
    } else blocks.push(archiveTextBlock("paragraph", "当天没有时间记录。"));
    for (const [heading, content] of [
      ["用户填写的完成情况", data.review.userCompletion || "尚未填写完成情况。"],
      ["生活记录", data.lifeRecord || "尚未填写生活记录。"],
      ["LLM 当天总结", data.review.dailySummary || data.review.summary || "尚未生成当天总结。"],
      ["时间分析", data.review.timeAnalysis || "暂无时间分析。"],
      ["问题与阻碍", data.review.problemAnalysis || "暂无问题分析。"],
      ["次日关注点", data.review.nextFocus || "暂无次日关注点。"],
    ]) {
      blocks.push(archiveTextBlock("heading_2", heading), archiveTextBlock("paragraph", content));
    }
    blocks.push({ object: "block", type: "divider", divider: {} });
    blocks.push(archiveTextBlock("paragraph", `由 Minimal Pomodoro 于 ${new Date(data.generatedAt).toLocaleString("zh-CN", { hour12: false })} 生成`));
    return blocks;
  }

  async function findDailyArchivePage(dateKey, source, config) {
    const archiveIdProperty = findProperty(source.properties, PROPERTY_ALIASES.archiveId, ["rich_text"]);
    if (archiveIdProperty) {
      const byId = await findPageByExternalId(source.id, archiveIdProperty, `daily:${dateKey}`, config);
      if (byId) return byId;
    }
    const dateProperty = findProperty(source.properties, PROPERTY_ALIASES.date, ["date"]);
    if (!dateProperty) return null;
    const pages = await queryDataSource(source.id, {
      page_size: 100,
      filter: { property: dateProperty[0], date: { equals: dateKey } },
    }, config);
    return pages.sort((left, right) => String(right.last_edited_time || "").localeCompare(String(left.last_edited_time || "")))[0] || null;
  }

  async function listBlockChildren(blockId, config) {
    const results = [];
    let cursor = "";
    do {
      const query = cursor ? `?page_size=100&start_cursor=${encodeURIComponent(cursor)}` : "?page_size=100";
      const response = await notionRequest(`/blocks/${normalizeNotionId(blockId)}/children${query}`, { method: "GET" }, config);
      results.push(...(response.results || []));
      cursor = response.has_more ? response.next_cursor : "";
    } while (cursor);
    return results;
  }

  async function replacePageChildren(pageId, children, config) {
    const existing = await listBlockChildren(pageId, config);
    for (const block of existing) {
      await notionRequest(`/blocks/${normalizeNotionId(block.id)}`, { method: "DELETE" }, config);
      await wait(120);
    }
    for (let index = 0; index < children.length; index += 100) {
      await notionRequest(`/blocks/${normalizeNotionId(pageId)}/children`, {
        method: "PATCH",
        body: JSON.stringify({ children: children.slice(index, index + 100) }),
      }, config);
      await wait(160);
    }
  }

  async function loadDailyArchive(dateKey, configInput) {
    const config = configInput || await getConfig();
    if (!config.dailyArchiveSourceId) return null;
    const source = await resolveDataSource(config.dailyArchiveSourceId, config);
    const page = await findDailyArchivePage(dateKey, source, config);
    return page ? { ...pageToPlainObject(page), date: dateKey } : null;
  }

  async function generateDailyArchive(dateKey, configInput, options = {}) {
    const config = configInput || await getConfig();
    if (!config.dailyArchiveSourceId) throw new Error("请先初始化或绑定 Daily Archive 数据源。");
    const data = await buildDailyArchiveData(dateKey, config, options);
    if (!(data.review.dailySummary || data.review.summary)) throw new Error(`${dateKey} 尚未生成当天总结，暂不能生成每日归档。`);
    const source = await resolveDataSource(config.dailyArchiveSourceId, config);
    const properties = {};
    setProperty(properties, findTitleProperty(source.properties), { title: richText(`${dateKey} 每日归档`) });
    setProperty(properties, findProperty(source.properties, PROPERTY_ALIASES.archiveId, ["rich_text"]), { rich_text: richText(`daily:${dateKey}`) });
    setProperty(properties, findProperty(source.properties, PROPERTY_ALIASES.date, ["date"]), { date: { start: dateKey } });
    setProperty(properties, findProperty(source.properties, PROPERTY_ALIASES.phasePlanLinkId, ["rich_text"]), { rich_text: richText(data.phasePlan?.planId || "") });
    setProperty(properties, findProperty(source.properties, PROPERTY_ALIASES.phasePlanName, ["rich_text"]), { rich_text: richText(data.phasePlan?.title || "") });
    setProperty(properties, findProperty(source.properties, PROPERTY_ALIASES.totalMinutes, ["number"]), { number: data.metrics.totalMinutes });
    setProperty(properties, findProperty(source.properties, PROPERTY_ALIASES.workMinutes, ["number"]), { number: data.metrics.workMinutes });
    setProperty(properties, findProperty(source.properties, PROPERTY_ALIASES.todoCount, ["number"]), { number: data.metrics.todoCount });
    setProperty(properties, findProperty(source.properties, PROPERTY_ALIASES.completedTodoCount, ["number"]), { number: data.metrics.completedTodoCount });
    setProperty(properties, findProperty(source.properties, PROPERTY_ALIASES.pomodoroCount, ["number"]), { number: data.metrics.pomodoroCount });
    setProperty(properties, findProperty(source.properties, PROPERTY_ALIASES.generatedAt, ["date"]), { date: { start: data.generatedAt } });
    setProperty(properties, findProperty(source.properties, PROPERTY_ALIASES.documentVersion, ["rich_text"]), { rich_text: richText("1") });
    const existing = await findDailyArchivePage(dateKey, source, config);
    const page = existing
      ? await notionRequest(`/pages/${normalizeNotionId(existing.id)}`, { method: "PATCH", body: JSON.stringify({ properties }) }, config)
      : await notionRequest("/pages", {
        method: "POST",
        body: JSON.stringify({ parent: { type: "data_source_id", data_source_id: source.id }, properties }),
      }, config);
    await replacePageChildren(page.id, buildDailyArchiveBlocks(data), config);
    return { id: page.id, url: page.url, date: dateKey, markdown: buildDailyArchiveMarkdown(data), metrics: data.metrics };
  }

  async function exportDailyArchiveMarkdown(dateKey, configInput) {
    const data = await buildDailyArchiveData(dateKey, configInput);
    return {
      date: dateKey,
      filename: `minimal-pomodoro-${dateKey}.md`,
      markdown: buildDailyArchiveMarkdown(data),
    };
  }

  async function testConnections(configInput) {
    const config = configInput || await getConfig();
    requireToken(config);
    const results = {};
    for (const [key, id] of [
      ["timeRecord", config.timeRecordSourceId],
      ["weeklyPlan", config.weeklyPlanSourceId],
      ["planningProfile", config.planningProfileSourceId],
      ["dailyPlan", config.dailyPlanSourceId],
      ["dailyReview", config.dailyReviewSourceId],
      ["dailyArchive", config.dailyArchiveSourceId],
    ]) {
      if (!id) continue;
      const source = await resolveDataSource(id, config);
      const warnings = validateSourceSchema(key, source.properties || {});
      results[key] = {
        id: source.id,
        name: (source.title || []).map((item) => item.plain_text || "").join("") || source.name || key,
        properties: Object.fromEntries(
          Object.entries(source.properties || {}).map(([name, property]) => [name, property.type])
        ),
        warnings,
      };
    }
    return results;
  }

  function validateSourceSchema(kind, schema) {
    if (!findTitleProperty(schema)) {
      throw new Error(`${kind} 数据源缺少 Title 属性。`);
    }

    if (kind === "timeRecord") {
      const time = findProperty(schema, PROPERTY_ALIASES.time, ["date"]);
      const start = findProperty(schema, PROPERTY_ALIASES.start, ["date"]);
      if (!time && !start) {
        throw new Error("Time Record 数据源缺少“时间”或“开始时间”Date 属性。");
      }
      const warnings = [];
      if (!findProperty(schema, PROPERTY_ALIASES.recordId, ["rich_text"])) {
        warnings.push("建议增加“记录 ID”Rich text 字段，以便跨设备查重。");
      }
      if (!findProperty(schema, PROPERTY_ALIASES.evaluation, ["rich_text"])) {
        warnings.push("未找到“评价”Rich text 字段。");
      }
      if (!findProperty(schema, PROPERTY_ALIASES.note, ["rich_text"])) {
        warnings.push("未找到“备注”Rich text 字段。");
      }
      return warnings;
    }

    if (kind === "weeklyPlan") {
      if (!findProperty(schema, PROPERTY_ALIASES.weekStart, ["date"])) {
        throw new Error("Phase Plan 数据源缺少“开始日期”Date 属性。");
      }
      if (!findProperty(schema, PROPERTY_ALIASES.weeklyGoals, ["rich_text"])) {
        throw new Error("Phase Plan 数据源缺少“计划描述”Rich text 属性。");
      }
      return [];
    }

    if (kind === "planningProfile") {
      if (!findProperty(schema, PROPERTY_ALIASES.profileId, ["rich_text"]) ||
          !findProperty(schema, PROPERTY_ALIASES.configJson, ["rich_text"])) {
        throw new Error("Planning Profile 数据源缺少 Profile ID 或配置 JSON 属性。");
      }
      return [];
    }

    if (kind === "dailyArchive") {
      if (!findProperty(schema, PROPERTY_ALIASES.archiveId, ["rich_text"]) ||
          !findProperty(schema, PROPERTY_ALIASES.date, ["date"])) {
        throw new Error("Daily Archive 数据源缺少“归档 ID”Rich text 或“日期”Date 属性。");
      }
      return [];
    }

    if (!findProperty(schema, PROPERTY_ALIASES.date, ["date"])) {
      throw new Error(`${kind === "dailyPlan" ? "Daily Todo" : "Daily Review"} 数据源缺少“日期”Date 属性。`);
    }

    if (kind === "dailyReview") {
      const reviewFields = [
        [PROPERTY_ALIASES.userCompletion, "用户完成情况"],
        [PROPERTY_ALIASES.dailySummary, "今日总结"],
        [PROPERTY_ALIASES.timeAnalysis, "时间分析"],
        [PROPERTY_ALIASES.problemAnalysis, "问题分析"],
        [PROPERTY_ALIASES.nextFocus, "次日关注点"],
      ];
      const missing = reviewFields
        .filter(([aliases]) => !findProperty(schema, aliases, ["rich_text"]))
        .map(([, label]) => label);
      return missing.length ? [`未找到 Rich text 字段：${missing.join("、")}。`] : [];
    }

    return [];
  }

  global.MinimalPomodoroNotion = Object.freeze({
    API_VERSION,
    CONFIG_KEY,
    SYNC_MAP_KEY,
    SYNC_STATE_KEY,
    DELETED_RECORDS_KEY,
    WRITE_QUEUE_KEY,
    WRITE_QUEUE_STATE_KEY,
    DEFAULT_CONFIG,
    WORKSPACE_DATABASES,
    getConfig,
    saveConfig,
    getQueuedWrites,
    getWriteQueueState,
    queueDailyTodoUpsert,
    queueDailyTodoDelete,
    queueDailyCompletion,
    queueLifeRecord,
    cacheLifeRecord,
    loadLifeRecordsInRange,
    queuePlanningProfile,
    flushWriteQueue,
    normalizeNotionId,
    resolveDataSource,
    initializeWorkspace,
    testConnections,
    extractTimelineRecords,
    loadAllLocalRecords,
    syncRecords,
    syncAllLocalRecords,
    syncDateRange,
    pullTimeRecordsFromNotion,
    loadDailyPlan,
    loadDailyTodos,
    loadWeeklyPlan,
    loadPhasePlan,
    loadPhasePlansInRange,
    loadAllPhasePlans,
    savePhasePlan,
    updatePhasePlanMetadata,
    deletePhasePlan,
    decomposePhasePlan,
    parseNaturalLanguageTimeRecords,
    adjustPhasePlan,
    endPhasePlanEarly,
    summarizePhasePlan,
    summarizeExpiredPhasePlans,
    loadPlanningProfile,
    savePlanningProfile,
    loadDailyCompletion,
    loadDailyReview,
    saveDailyCompletion,
    loadDailyArchive,
    generateDailyArchive,
    exportDailyArchiveMarkdown,
    upsertDailyTodos,
    saveDailyTodo,
    setDailyTodoStatus,
    deleteDailyTodo,
    markDailyTodoStarted,
    previewTodoAdjustment,
    applyTodoAdjustment,
    adjustIntradayTodos,
    generateDayTodos,
    generateInitialDayTodos,
    writeDailyReview,
    triggerDailyReview,
  });
})(globalThis);
