(function initializeNotionIntegration() {
  "use strict";

  const api = globalThis.MinimalPomodoroNotion;
  if (!api) return;

  const elements = {
    form: document.getElementById("notionSettingsForm"),
    token: document.getElementById("notionToken"),
    tokenVisibility: document.getElementById("notionTokenVisibility"),
    workspaceParent: document.getElementById("notionWorkspaceParent"),
    initializeWorkspace: document.getElementById("notionInitializeWorkspace"),
    workspaceResult: document.getElementById("notionWorkspaceResult"),
    timeRecordSource: document.getElementById("notionTimeRecordSource"),
    weeklyPlanSource: document.getElementById("notionWeeklyPlanSource"),
    planningProfileSource: document.getElementById("notionPlanningProfileSource"),
    dailyPlanSource: document.getElementById("notionDailyPlanSource"),
    dailyReviewSource: document.getElementById("notionDailyReviewSource"),
    dailyArchiveSource: document.getElementById("notionDailyArchiveSource"),
    autoSync: document.getElementById("notionAutoSync"),
    syncIntervalMinutes: document.getElementById("notionSyncIntervalMinutes"),
    dailyReviewEnabled: document.getElementById("notionDailyReviewEnabled"),
    intradayAdjustmentEnabled: document.getElementById("notionIntradayAdjustmentEnabled"),
    dailyReviewTime: document.getElementById("notionDailyReviewTime"),
    llmEndpoint: document.getElementById("notionLlmEndpoint"),
    llmModel: document.getElementById("notionLlmModel"),
    llmApiKey: document.getElementById("notionLlmApiKey"),
    llmKeyVisibility: document.getElementById("notionLlmKeyVisibility"),
    weekFlowGrid: document.getElementById("weekFlowGrid"),
    todayFlowGrid: document.getElementById("todayFlowGrid"),
    flowOperationStatus: document.getElementById("flowOperationStatus"),
    todayFlowOperationStatus: document.getElementById("todayFlowOperationStatus"),
    todayPhasePlanDock: document.getElementById("todayPhasePlanDock"),
    phasePlanCard: document.getElementById("phasePlanCard"),
    phasePlansDatabase: document.getElementById("phasePlansDatabase"),
    phasePlansCreate: document.getElementById("phasePlansCreate"),
    phasePlansStatus: document.getElementById("phasePlansStatus"),
    testConnection: document.getElementById("notionTestConnection"),
    syncWeek: document.getElementById("notionSyncWeek"),
    syncAll: document.getElementById("notionSyncAll"),
    loadPlan: document.getElementById("notionLoadPlan"),
    triggerReview: document.getElementById("notionTriggerReview"),
    planDate: document.getElementById("notionPlanDate"),
    planList: document.getElementById("notionPlanList"),
    weeklyPlanView: document.getElementById("notionWeeklyPlanView"),
    newTodo: document.getElementById("notionNewTodo"),
    todoEditor: document.getElementById("notionTodoEditor"),
    todoId: document.getElementById("notionTodoId"),
    todoTitle: document.getElementById("notionTodoTitle"),
    todoPriority: document.getElementById("notionTodoPriority"),
    todoStart: document.getElementById("notionTodoStart"),
    todoEnd: document.getElementById("notionTodoEnd"),
    todoEstimate: document.getElementById("notionTodoEstimate"),
    todoDetails: document.getElementById("notionTodoDetails"),
    todoEditorStart: document.getElementById("notionTodoEditorStart"),
    cancelTodo: document.getElementById("notionCancelTodo"),
    todoEditorClose: document.getElementById("notionTodoEditorClose"),
    todoAdjustment: document.getElementById("notionTodoAdjustment"),
    adjustBox: document.querySelector(".notion-adjust-box"),
    previewAdjustment: document.getElementById("notionPreviewAdjustment"),
    phasePlanForm: document.getElementById("notionPhasePlanForm"),
    phasePlanPageId: document.getElementById("notionPhasePlanPageId"),
    phaseStart: document.getElementById("notionPhaseStart"),
    phaseEnd: document.getElementById("notionPhaseEnd"),
    phaseDescription: document.getElementById("notionPhaseDescription"),
    phaseConstraints: document.getElementById("notionPhaseConstraints"),
    openPhaseCreate: document.getElementById("notionOpenPhaseCreate"),
    openPhaseAdjust: document.getElementById("notionOpenPhaseAdjust"),
    summarizePhase: document.getElementById("notionSummarizePhase"),
    phaseAdjustedEnd: document.getElementById("notionPhaseAdjustedEnd"),
    phaseAdjustedEndField: document.getElementById("notionPhaseAdjustedEndField"),
    phaseAdjustedEndLabel: document.getElementById("notionPhaseAdjustedEndLabel"),
    phaseCurrentRange: document.getElementById("notionPhaseCurrentRange"),
    phaseAdjustBox: document.querySelector(".phase-adjust-box"),
    phaseAdjustment: document.getElementById("notionPhaseAdjustment"),
    adjustPhase: document.getElementById("notionAdjustPhase"),
    phaseSummary: document.getElementById("notionPhaseSummary"),
    profileForm: document.getElementById("notionProfileForm"),
    profileTimezone: document.getElementById("notionProfileTimezone"),
    workWindows: document.getElementById("notionWorkWindows"),
    routineBlocks: document.getElementById("notionRoutineBlocks"),
    dateOverrides: document.getElementById("notionDateOverrides"),
    profileWorkMinutes: document.getElementById("notionProfileWorkMinutes"),
    profileBreakMinutes: document.getElementById("notionProfileBreakMinutes"),
    preferenceNote: document.getElementById("notionPreferenceNote"),
    dailyCompletion: document.getElementById("notionDailyCompletion"),
    saveCompletion: document.getElementById("notionSaveCompletion"),
    status: document.getElementById("notionStatus"),
    syncMeta: document.getElementById("notionSyncMeta"),
    progress: document.getElementById("notionProgress"),
    progressBar: document.getElementById("notionProgressBar"),
    progressText: document.getElementById("notionProgressText"),
    connectionState: document.getElementById("notionConnectionState"),
    connectionText: document.getElementById("notionConnectionText"),
    llmTaskChip: document.getElementById("llmTaskChip"),
    llmTaskChipText: document.getElementById("llmTaskChipText"),
    llmTaskChipElapsed: document.getElementById("llmTaskChipElapsed"),
    notionQueueChip: document.getElementById("notionQueueChip"),
    notionQueueChipText: document.getElementById("notionQueueChipText"),
  };

  let currentTodos = [];
  const flowTodosByDate = new Map();
  let pendingAdjustment = null;
  let flowLoadSequence = 0;
  let gridLoadSequence = 0;
  let selectedFlowDate = "";
  let todoEditorOverlay = null;
  let adjustmentOverlay = null;
  let llmProgressOverlay = null;
  let llmProgressBusy = false;
  let llmProgressTitle = null;
  let llmProgressElapsed = null;
  let llmProgressStatus = null;
  let llmProgressResult = null;
  let llmProgressClose = null;
  let llmExternalElapsedTimer = null;
  let llmExternalStartedAt = 0;
  let llmExternalHeartbeatAt = 0;
  let llmExternalPhase = "";
  let adjustmentMode = "adjust";
  let scheduleDelayToggle = null;
  let adjustmentDialogTitle = null;
  let adjustmentDialogDescription = null;
  let phaseEditorOverlay = null;
  let phaseEditorTitle = null;
  let phaseEditorDescription = null;
  let phaseSummaryChoice = null;
  let pendingPhaseSummaryPlan = null;
  let activePhasePlan = null;
  let allPhasePlans = [];
  let phaseMetadataForm = null;
  let editingPhasePlan = null;
  let workflowStash = null;
  const PLANNING_CACHE_KEY = "minimalPomodoroNotionPlanningCache:v1";
  let planningCacheWriteQueue = Promise.resolve();

  if (!elements.form) return;
  setupWorkflowSurfaces();
  bindEvents();
  loadConfiguration();
  chrome.storage.onChanged.addListener(handleNotionStorageChange);

  function bindEvents() {
    elements.form.addEventListener("submit", async (event) => {
      event.preventDefault();
      await runOperation("正在保存 Notion 设置…", async () => {
        await persistFormConfig();
        return "设置已保存在本机。";
      });
    });
    elements.intradayAdjustmentEnabled.addEventListener("change", persistAutomationSettings);
    elements.dailyReviewEnabled.addEventListener("change", persistAutomationSettings);
    elements.testConnection.addEventListener("click", testConnection);
    elements.tokenVisibility.addEventListener("click", () => toggleSecretVisibility(elements.token, elements.tokenVisibility));
    elements.llmKeyVisibility.addEventListener("click", () => toggleSecretVisibility(elements.llmApiKey, elements.llmKeyVisibility));
    document.getElementById("notionMode")?.addEventListener("click", loadConfiguration);
    window.addEventListener("minimal-pomodoro-mode-change", handleModeChange);
    window.addEventListener("minimal-pomodoro-week-flow-rendered", handleWeekFlowRendered);
    window.addEventListener("minimal-pomodoro-open-grid-todo", handleGridTodoOpen);
    window.addEventListener("minimal-pomodoro-todo-menu-action", handleTodoMenuAction);
    elements.weekFlowGrid?.addEventListener("click", handleFlowAction);
    elements.weekFlowGrid?.addEventListener("input", handleFlowInput);
    elements.todayFlowGrid?.addEventListener("click", handleFlowAction);
    elements.todayFlowGrid?.addEventListener("input", handleFlowInput);
    window.addEventListener("minimal-pomodoro-today-date-rendered", handleTodayDateRendered);
    elements.initializeWorkspace.addEventListener("click", initializeWorkspace);
    elements.syncWeek.addEventListener("click", () => syncRecords("week"));
    elements.syncAll.addEventListener("click", () => syncRecords("all"));
    elements.loadPlan.addEventListener("click", loadPlan);
    elements.planDate.addEventListener("change", loadPlanningContext);
    elements.phaseStart.addEventListener("change", () => {
      elements.phaseEnd.min = elements.phaseStart.value;
      if (!elements.phaseEnd.value || elements.phaseEnd.value < elements.phaseStart.value) {
        elements.phaseEnd.value = addDays(elements.phaseStart.value, 6);
      }
    });
    elements.planList.addEventListener("click", handleTodoAction);
    elements.newTodo.addEventListener("click", () => openTodoEditor());
    elements.todoEditor.addEventListener("submit", saveTodo);
    elements.cancelTodo.addEventListener("click", closeTodoEditor);
    elements.todoEditorClose?.addEventListener("click", closeTodoEditor);
    elements.todoEditorStart?.addEventListener("click", startTodoFromEditor);
    elements.previewAdjustment.addEventListener("click", previewAdjustment);
    elements.phasePlanForm.addEventListener("submit", decomposePhasePlan);
    elements.openPhaseCreate.addEventListener("click", () => openPhaseCreateEditor());
    elements.openPhaseAdjust.addEventListener("click", openPhaseAdjustEditor);
    elements.summarizePhase.addEventListener("click", () => generatePhaseSummary(activePhasePlan, elements.summarizePhase));
    elements.phaseAdjustedEndField.closest(".phase-adjust-box")?.addEventListener("change", handlePhaseAdjustModeChange);
    elements.adjustPhase.addEventListener("click", adjustPhasePlan);
    elements.phasePlansCreate?.addEventListener("click", () => openPhaseCreateEditor(notionDateKey(new Date())));
    elements.phasePlansDatabase?.addEventListener("click", handlePhaseDatabaseAction);
    elements.profileForm.addEventListener("submit", saveProfile);
    elements.saveCompletion.addEventListener("click", saveCompletion);
    elements.triggerReview.addEventListener("click", triggerReview);
    elements.llmTaskChip?.addEventListener("click", restoreLlmProgress);
    elements.notionQueueChip?.addEventListener("click", flushPendingWritesNow);
  }

  async function persistAutomationSettings() {
    try {
      await persistFormConfig();
      setStatus("success", "自动化开关已保存到本机。");
    } catch (error) {
      setStatus("error", friendlyError(error));
    }
  }

  function planningCacheNamespace(config) {
    return [
      config.workspaceParentPageId,
      config.weeklyPlanSourceId,
      config.dailyPlanSourceId,
      config.dailyReviewSourceId,
      config.dailyArchiveSourceId,
    ].map((value) => String(value || "")).join("|");
  }

  function emptyPlanningCache(config) {
    return {
      version: 1,
      namespace: planningCacheNamespace(config),
      updatedAt: "",
      todos: {},
      reviews: {},
      archives: {},
      phaseRanges: {},
      phasesByDate: {},
    };
  }

  async function readPlanningCache(config) {
    const stored = await chrome.storage.local.get(PLANNING_CACHE_KEY);
    const cache = stored[PLANNING_CACHE_KEY];
    if (!cache || cache.version !== 1 || cache.namespace !== planningCacheNamespace(config)) {
      return emptyPlanningCache(config);
    }
    return {
      ...emptyPlanningCache(config),
      ...cache,
      todos: cache.todos || {},
      reviews: cache.reviews || {},
      archives: cache.archives || {},
      phaseRanges: cache.phaseRanges || {},
      phasesByDate: cache.phasesByDate || {},
    };
  }

  function queuePlanningCacheUpdate(config, updater) {
    planningCacheWriteQueue = planningCacheWriteQueue
      .catch(() => {})
      .then(async () => {
        const cache = await readPlanningCache(config);
        updater(cache);
        trimPlanningCache(cache);
        cache.updatedAt = new Date().toISOString();
        await chrome.storage.local.set({ [PLANNING_CACHE_KEY]: cache });
      });
    return planningCacheWriteQueue;
  }

  function trimPlanningCache(cache) {
    const trimBucket = (bucket, limit) => {
      const entries = Object.entries(bucket || {});
      if (entries.length <= limit) return bucket || {};
      return Object.fromEntries(entries
        .sort((left, right) => String(right[1]?.cachedAt || "").localeCompare(String(left[1]?.cachedAt || "")))
        .slice(0, limit));
    };
    cache.todos = trimBucket(cache.todos, 120);
    cache.reviews = trimBucket(cache.reviews, 120);
    cache.archives = trimBucket(cache.archives, 120);
    cache.phasesByDate = trimBucket(cache.phasesByDate, 120);
    cache.phaseRanges = trimBucket(cache.phaseRanges, 32);
  }

  function cacheEntry(value) {
    return { value, cachedAt: new Date().toISOString() };
  }

  function setupWorkflowSurfaces() {
    workflowStash = document.createElement("div");
    workflowStash.className = "hidden";
    workflowStash.id = "notionWorkflowStash";
    document.body.appendChild(workflowStash);

    todoEditorOverlay = document.createElement("div");
    todoEditorOverlay.className = "todo-editor-overlay hidden";
    todoEditorOverlay.id = "notionTodoEditorOverlay";
    todoEditorOverlay.setAttribute("role", "dialog");
    todoEditorOverlay.setAttribute("aria-modal", "true");
    todoEditorOverlay.setAttribute("aria-labelledby", "notionTodoEditorTitle");
    document.body.appendChild(todoEditorOverlay);
    todoEditorOverlay.appendChild(elements.todoEditor);
    bindBackdropDismiss(todoEditorOverlay, closeTodoEditor);
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !todoEditorOverlay.classList.contains("hidden")) closeTodoEditor();
      if (event.key === "Escape" && adjustmentOverlay && !adjustmentOverlay.classList.contains("hidden")) closeAdjustmentEditor();
      if (event.key === "Escape" && phaseEditorOverlay && !phaseEditorOverlay.classList.contains("hidden")) closePhaseEditor();
    });

    adjustmentOverlay = document.createElement("div");
    adjustmentOverlay.className = "todo-editor-overlay hidden";
    adjustmentOverlay.id = "notionAdjustmentOverlay";
    adjustmentOverlay.setAttribute("role", "dialog");
    adjustmentOverlay.setAttribute("aria-modal", "true");
    const adjustmentDialog = document.createElement("section");
    adjustmentDialog.className = "notion-adjust-dialog";
    adjustmentDialog.innerHTML = `
      <div class="todo-editor-head">
        <div><h3 data-adjustment-title>让 LLM 调整当天待办</h3><p data-adjustment-description>用自然语言描述需要调整的方向，预览后再应用。</p></div>
        <button class="ghost" type="button" data-close-adjustment>关闭</button>
      </div>
      <label class="schedule-delay-option">
        <input type="checkbox" data-schedule-delay checked />
        <span><strong>为开始执行预留 10 分钟</strong><small>勾选后从当前时间 10 分钟后排程；取消勾选则允许从当前时间开始。</small></span>
      </label>`;
    adjustmentDialog.appendChild(elements.adjustBox);
    adjustmentOverlay.appendChild(adjustmentDialog);
    document.body.appendChild(adjustmentOverlay);
    adjustmentDialogTitle = adjustmentDialog.querySelector("[data-adjustment-title]");
    adjustmentDialogDescription = adjustmentDialog.querySelector("[data-adjustment-description]");
    scheduleDelayToggle = adjustmentDialog.querySelector("[data-schedule-delay]");
    bindBackdropDismiss(adjustmentOverlay, closeAdjustmentEditor);
    adjustmentOverlay.addEventListener("click", (event) => {
      if (event.target.closest("[data-close-adjustment]")) closeAdjustmentEditor();
    });

    phaseEditorOverlay = document.createElement("div");
    phaseEditorOverlay.className = "todo-editor-overlay hidden";
    phaseEditorOverlay.id = "notionPhaseEditorOverlay";
    phaseEditorOverlay.setAttribute("role", "dialog");
    phaseEditorOverlay.setAttribute("aria-modal", "true");
    phaseEditorOverlay.setAttribute("aria-labelledby", "notionPhaseEditorTitle");
    const phaseDialog = document.createElement("section");
    phaseDialog.className = "notion-phase-dialog";
    phaseDialog.innerHTML = `
      <div class="todo-editor-head">
        <div><h3 id="notionPhaseEditorTitle">生成阶段计划</h3><p data-phase-editor-description>选择日期范围，再用自然语言说明目标。</p></div>
        <button class="ghost" type="button" data-close-phase-editor>关闭</button>
      </div>`;
    phaseDialog.appendChild(elements.phasePlanForm);
    phaseMetadataForm = document.createElement("form");
    phaseMetadataForm.className = "notion-inline-editor phase-metadata-editor hidden";
    phaseMetadataForm.innerHTML = `
      <div class="notion-form-grid">
        <label class="notion-field"><span>计划名称 <em class="notion-required">必填</em></span><input name="title" required maxlength="200" /></label>
        <label class="notion-field"><span>状态</span><select name="status"><option value="active">进行中</option><option value="completed">已结束</option></select></label>
        <label class="notion-field"><span>开始日期 <em class="notion-required">必填</em></span><input name="startDate" type="date" required /></label>
        <label class="notion-field"><span>结束日期 <em class="notion-required">必填</em></span><input name="endDate" type="date" required /></label>
      </div>
      <label class="notion-field notion-field-wide"><span>计划描述 <em class="notion-required">必填</em></span><textarea name="description" rows="5" required></textarea></label>
      <label class="notion-field notion-field-wide"><span>约束与说明 <small>选填</small></span><textarea name="constraints" rows="3"></textarea></label>
      <small>修改日期范围后，新范围内的待办、日报和每日归档会重新绑定，移出范围的日期会解除绑定。</small>
      <div class="notion-actions"><button class="primary" type="submit">保存修改</button><button class="ghost" type="button" data-cancel-phase-metadata>取消</button></div>`;
    phaseDialog.appendChild(phaseMetadataForm);
    phaseDialog.appendChild(elements.phaseAdjustBox);
    phaseSummaryChoice = document.createElement("div");
    phaseSummaryChoice.className = "phase-summary-choice hidden";
    phaseSummaryChoice.innerHTML = `
      <div class="phase-summary-choice-icon" aria-hidden="true">✓</div>
      <div><h4>阶段计划已结束</h4><p data-phase-summary-choice-text>是否现在根据这段时间的待办、完成情况和真实时间记录生成阶段总结？</p></div>
      <div class="notion-actions">
        <button class="primary" type="button" data-generate-phase-summary>现在生成总结</button>
        <button class="ghost" type="button" data-skip-phase-summary>稍后再说</button>
      </div>`;
    phaseDialog.appendChild(phaseSummaryChoice);
    phaseEditorOverlay.appendChild(phaseDialog);
    document.body.appendChild(phaseEditorOverlay);
    phaseEditorTitle = phaseDialog.querySelector("#notionPhaseEditorTitle");
    phaseEditorDescription = phaseDialog.querySelector("[data-phase-editor-description]");
    phaseMetadataForm.addEventListener("submit", savePhaseMetadata);
    phaseMetadataForm.addEventListener("click", (event) => {
      if (event.target.closest("[data-cancel-phase-metadata]")) closePhaseEditor();
    });
    bindBackdropDismiss(phaseEditorOverlay, closePhaseEditor);
    phaseEditorOverlay.addEventListener("click", (event) => {
      if (event.target.closest("[data-close-phase-editor]")) closePhaseEditor();
      if (event.target.closest("[data-skip-phase-summary]")) closePhaseEditor();
      const summaryButton = event.target.closest("[data-generate-phase-summary]");
      if (summaryButton) generatePhaseSummary(pendingPhaseSummaryPlan, summaryButton);
    });

    llmProgressOverlay = document.createElement("div");
    llmProgressOverlay.className = "llm-progress-overlay hidden";
    llmProgressOverlay.setAttribute("role", "dialog");
    llmProgressOverlay.setAttribute("aria-modal", "true");
    llmProgressOverlay.setAttribute("aria-live", "polite");
    llmProgressOverlay.innerHTML = `
      <section class="llm-progress-card">
        <header>
          <div><span>LLM 任务</span><h3 data-llm-progress-title>正在处理</h3></div>
          <button class="ghost" type="button" data-llm-progress-close>转到后台</button>
        </header>
        <div class="llm-progress-meta"><span data-llm-progress-status>正在准备请求…</span><time data-llm-progress-elapsed>0 秒</time></div>
        <ol class="llm-progress-steps">
          <li data-llm-step="sent"><i></i><span>准备与读取数据</span></li>
          <li data-llm-step="generating"><i></i><span>LLM 生成 / 自动修正</span></li>
          <li data-llm-step="writing"><i></i><span>校验并写入 Notion</span></li>
          <li data-llm-step="done"><i></i><span>已完成</span></li>
        </ol>
        <div class="llm-progress-result hidden" data-llm-progress-result></div>
      </section>`;
    document.body.appendChild(llmProgressOverlay);
    llmProgressTitle = llmProgressOverlay.querySelector("[data-llm-progress-title]");
    llmProgressElapsed = llmProgressOverlay.querySelector("[data-llm-progress-elapsed]");
    llmProgressStatus = llmProgressOverlay.querySelector("[data-llm-progress-status]");
    llmProgressResult = llmProgressOverlay.querySelector("[data-llm-progress-result]");
    llmProgressClose = llmProgressOverlay.querySelector("[data-llm-progress-close]");
    llmProgressOverlay.addEventListener("click", (event) => {
      if (event.target.closest("[data-llm-progress-close]")) {
        if (llmProgressBusy) minimizeLlmProgress();
        else closeLlmProgress();
      }
      if (event.target.closest("#notionApplyAdjustment")) applyAdjustment(event);
    });

    mountPhasePlan("today");
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

  function handleModeChange(event) {
    const mode = event.detail?.mode;
    mountPhasePlan(mode);
    if (mode === "today") {
      const today = visibleTodayDateKey();
      selectedFlowDate = today;
      applySelectedFlowCard();
      return;
    }
    if (mode === "text") {
      const keys = currentWeekDateKeys();
      const today = notionDateKey(new Date());
      if (keys.includes(today)) selectedFlowDate = today;
    }
    if (mode === "grid") {
      const keys = currentWeekDateKeys();
      loadGridTodos(keys).catch((error) => console.warn("Unable to load grid planning data", error));
    }
    if (mode === "phases") {
      loadAllPhasePlans().catch((error) => {
        renderPhaseDatabaseError(friendlyError(error));
      });
    }
  }

  async function handleGridTodoOpen(event) {
    const dateKey = String(event.detail?.dateKey || "");
    const todoId = String(event.detail?.todoId || "");
    if (!dateKey || !todoId) return;
    const cachedTodo = event.detail?.todo;
    if (cachedTodo && (cachedTodo.id === todoId || cachedTodo.externalId === todoId)) {
      elements.planDate.value = dateKey;
      currentTodos = [cachedTodo];
      openTodoEditor(cachedTodo);
      return;
    }
    try {
      const config = await api.getConfig();
      const todos = await api.loadDailyTodos(dateKey, config);
      const todo = todos.find((item) => item.id === todoId || item.externalId === todoId);
      if (!todo) throw new Error("找不到该待办，可能已在 Notion 中删除。请刷新后重试。");
      elements.planDate.value = dateKey;
      currentTodos = todos;
      openTodoEditor(todo);
    } catch (error) {
      setStatus("error", friendlyError(error));
    }
  }

  function mountPhasePlan(mode) {
    const target = mode === "today" ? elements.todayPhasePlanDock : workflowStash;
    if (target && elements.phasePlanCard && elements.phasePlanCard.parentElement !== target) {
      target.appendChild(elements.phasePlanCard);
    }
  }

  function handleWeekFlowRendered(event) {
    const dateKeys = event.detail?.dateKeys || currentWeekDateKeys();
    const loadOptions = { cacheOnly: event.detail?.remote !== true };
    if (!document.getElementById("todayView")?.classList.contains("hidden")) {
      const today = visibleTodayDateKey();
      mountPhasePlan("today");
      selectedFlowDate = today;
      applySelectedFlowCard();
      Promise.all([
        loadWeekFlow([today], loadOptions),
        loadOptions.cacheOnly ? Promise.resolve() : loadGridTodos([today]),
        loadOptions.cacheOnly ? Promise.resolve() : loadPhaseForDate(today),
      ])
        .catch((error) => {
          console.warn("Unable to load today workflow", error);
          setStatus("error", friendlyError(error));
        });
      return;
    }
    if (document.getElementById("textView")?.classList.contains("hidden")) {
      if (!document.getElementById("gridView")?.classList.contains("hidden")) {
        loadGridTodos(dateKeys)
          .catch((error) => console.warn("Unable to refresh grid planning data", error));
      }
      return;
    }
    selectedFlowDate = preferredFlowDate(dateKeys);
    applySelectedFlowCard();
    loadWeekFlow(dateKeys, loadOptions).catch((error) => {
      console.warn("Unable to load weekly workflow", error);
      setStatus("error", friendlyError(error));
    });
  }

  function visibleTodayDateKey() {
    return elements.todayFlowGrid?.querySelector("[data-flow-date]")?.dataset.flowDate || notionDateKey(new Date());
  }

  function handleTodayDateRendered(event) {
    const dateKey = event.detail?.dateKey || visibleTodayDateKey();
    if (document.getElementById("todayView")?.classList.contains("hidden")) return;
    mountPhasePlan("today");
    selectedFlowDate = dateKey;
    applySelectedFlowCard();
    Promise.all([loadWeekFlow([dateKey]), loadGridTodos([dateKey]), loadPhaseForDate(dateKey)])
      .catch((error) => console.warn("Unable to load selected-day workflow", error));
  }

  function preferredFlowDate(dateKeys) {
    if (selectedFlowDate && dateKeys.includes(selectedFlowDate)) return selectedFlowDate;
    const today = notionDateKey(new Date());
    return dateKeys.includes(today) ? today : (dateKeys[0] || today);
  }

  function applySelectedFlowCard() {
    for (const card of [elements.todayFlowGrid, elements.weekFlowGrid].flatMap((container) => container ? [...container.querySelectorAll("[data-flow-date]")] : [])) {
      const selected = card.dataset.flowDate === selectedFlowDate;
      card.classList.toggle("is-selected", selected);
      card.setAttribute("aria-selected", String(selected));
    }
    globalThis.PersonalSystemWorkspace?.updateFlowTabs(selectedFlowDate);
  }

  async function selectFlowDate(dateKey) {
    if (!dateKey) return;
    const changed = selectedFlowDate !== dateKey;
    selectedFlowDate = dateKey;
    elements.planDate.value = dateKey;
    applySelectedFlowCard();
    if (changed) await loadPhaseForDate(dateKey);
  }

  function toggleSecretVisibility(input, button) {
    const reveal = input.type === "password";
    input.type = reveal ? "text" : "password";
    button.textContent = reveal ? "隐藏" : "显示";
    button.setAttribute("aria-pressed", String(reveal));
    button.setAttribute("aria-label", reveal ? "隐藏敏感内容" : "显示敏感内容");
    input.focus({ preventScroll: true });
  }

  async function loadConfiguration() {
    const config = await api.getConfig();
    elements.token.value = config.token;
    elements.workspaceParent.value = config.workspaceParentPageId;
    elements.timeRecordSource.value = config.timeRecordSourceId;
    elements.weeklyPlanSource.value = config.weeklyPlanSourceId;
    elements.planningProfileSource.value = config.planningProfileSourceId;
    elements.dailyPlanSource.value = config.dailyPlanSourceId;
    elements.dailyReviewSource.value = config.dailyReviewSourceId;
    elements.dailyArchiveSource.value = config.dailyArchiveSourceId;
    elements.autoSync.checked = config.autoSync;
    elements.syncIntervalMinutes.value = config.syncIntervalMinutes || 10;
    elements.dailyReviewEnabled.checked = config.dailyReviewEnabled;
    elements.intradayAdjustmentEnabled.checked = config.intradayAdjustmentEnabled;
    elements.dailyReviewTime.value = config.dailyReviewTime;
    elements.llmEndpoint.value = config.llmEndpoint;
    elements.llmModel.value = config.llmModel;
    elements.llmApiKey.value = config.llmApiKey;
    elements.planDate.value = notionDateKey(new Date());
    elements.phaseStart.value = elements.planDate.value;
    elements.phaseEnd.value = addDays(elements.planDate.value, 6);
    elements.phaseEnd.min = elements.phaseStart.value;

    const stateResult = await chrome.storage.local.get([
      api.SYNC_STATE_KEY,
      "minimalPomodoroNotionAutomationState",
    ]);
    const state = stateResult[api.SYNC_STATE_KEY];
    if (state?.lastSyncAt) {
      elements.syncMeta.textContent = `上次同步：${formatLocalDateTime(state.lastSyncAt)}`;
      setConnectionState("success", "已配置 · 可同步");
    } else if (config.token && config.timeRecordSourceId) {
      setConnectionState("idle", "已配置 · 尚未测试");
    }
    applyAutomationState(stateResult.minimalPomodoroNotionAutomationState, { restoreOverlay: false });
    await refreshWriteQueueState();
    if (config.token && config.dailyPlanSourceId) {
      await loadPlanningContext({ silent: true });
    }
    if (config.token && config.planningProfileSourceId) await loadProfile(config, true);
    if (!document.getElementById("todayView")?.classList.contains("hidden")) {
      const today = visibleTodayDateKey();
      await Promise.all([loadWeekFlow([today]), loadGridTodos([today], config)])
        .catch((error) => console.warn("Unable to preload today planning data", error));
    } else if (!document.getElementById("gridView")?.classList.contains("hidden")) {
      const keys = currentWeekDateKeys();
      await loadGridTodos(keys, config)
        .catch((error) => console.warn("Unable to preload grid planning data", error));
    }
  }

  function handleNotionStorageChange(changes, areaName) {
    if (areaName !== "local") return;
    if (changes[api.WRITE_QUEUE_KEY] || changes[api.WRITE_QUEUE_STATE_KEY]) refreshWriteQueueState();
    const syncState = changes[api.SYNC_STATE_KEY]?.newValue;
    if (syncState?.lastSyncAt) {
      elements.syncMeta.textContent = `上次同步：${formatLocalDateTime(syncState.lastSyncAt)}`;
    }
    applyAutomationState(changes.minimalPomodoroNotionAutomationState?.newValue);
    const todoStatusSignal = changes.minimalPomodoroTodoStatusSignal?.newValue;
    if (todoStatusSignal?.dateKey && todoStatusSignal?.todoId) {
      updateLocalTodoCache(todoStatusSignal.dateKey, todoStatusSignal.externalId || todoStatusSignal.todoId, {
        status: todoStatusSignal.status || "in_progress",
        pendingSync: true,
      }).catch((error) => console.warn("Unable to apply started todo status locally", error));
    }
    const completionSignal = changes.minimalPomodoroCompletionRefreshSignal?.newValue;
    if (completionSignal?.dateKey && flowCard(completionSignal.dateKey)) {
      loadFlowDay(completionSignal.dateKey)
        .catch((error) => console.warn("Unable to refresh Pomodoro completion summary", error));
    }
    const changedRecordDates = Object.keys(changes)
      .filter((key) => key.startsWith("minimalPomodoroTimeline:"))
      .map((key) => key.slice("minimalPomodoroTimeline:".length))
      .filter((dateKey) => /^\d{4}-\d{2}-\d{2}$/.test(dateKey) && flowCard(dateKey));
    for (const dateKey of changedRecordDates) {
      loadFlowDay(dateKey)
        .catch((error) => console.warn("Unable to auto-complete todos from time records", error));
    }
    if (changes.minimalPomodoroNotionPullSignal?.newValue) {
      const keys = currentWeekDateKeys();
      if (!document.getElementById("todayView")?.classList.contains("hidden")) {
        const today = visibleTodayDateKey();
        Promise.all([loadWeekFlow([today]), loadGridTodos([today])])
          .catch((error) => console.warn("Unable to pull today planning data", error));
      } else if (!document.getElementById("textView")?.classList.contains("hidden")) {
        loadWeekFlow(keys).catch((error) => console.warn("Unable to pull Notion planning data", error));
      } else if (!document.getElementById("gridView")?.classList.contains("hidden")) {
        loadGridTodos(keys)
          .catch((error) => console.warn("Unable to pull grid planning data", error));
      } else if (!document.getElementById("phasePlansView")?.classList.contains("hidden")) {
        loadAllPhasePlans().catch((error) => console.warn("Unable to pull phase plans", error));
      }
    }
  }

  function applyAutomationState(state, options = {}) {
    if (!state) return;
    const restoreOverlay = options.restoreOverlay !== false;
    if (state.type === "sync_error" || state.type === "review_error") {
      setStatus("error", `后台自动化失败：${state.message || "未知错误"}`);
      setConnectionState("error", "后台自动化失败");
    } else if (state.type === "review_success") {
      setStatus(
        "success",
        `${state.dateKey || "当日"} 自动总结已完成${state.wroteToNotion ? "并写入 Notion" : ""}` +
        `${state.nextTodoDate ? `；${state.nextTodoDate} 已生成 ${state.todoCount || 0} 条待办` : ""}` +
        `${state.nextTodoSkipped ? `；次日待办已跳过（${state.nextTodoBlockedReason || "缺少可用计划"}）` : ""}` +
        `${state.archiveCreated ? "；每日归档已生成" : state.archiveError ? `；每日归档失败：${state.archiveError}` : ""}。`
      );
    } else if (state.type === "review_blocked") {
      setStatus("error", `每日生成已暂停：${state.message || "请补充必要信息"}`);
      setConnectionState("error", "等待用户补充完成情况");
    } else if (state.type === "intraday_adjustment") {
      const message = state.message || "正在调整今日剩余待办。";
      const heartbeatAt = Date.parse(state.at || "");
      const recent = Date.now() - heartbeatAt < 10 * 60 * 1000;
      const isWorkingPhase = ["sent", "reading", "generating", "repairing", "validating", "writing"].includes(state.phase);
      const visualPhase = state.phase === "writing"
        ? "writing"
        : ["generating", "repairing", "validating"].includes(state.phase) ? "generating" : "sent";
      if (isWorkingPhase) {
        setStatus("working", message);
        const phaseLabel = ({ sent: "准备中", reading: "读取 Notion", generating: "LLM 生成中", repairing: "LLM 自动修正中", validating: "校验中", writing: "写入 Notion" })[state.phase] || "处理中";
        setConnectionState("working", phaseLabel);
        if (restoreOverlay && !llmProgressBusy) {
          openLlmProgress("正在调整今日剩余待办", "各阶段按心跳独立监测", visualPhase);
        }
        if (llmProgressBusy) setLlmProgressStep(visualPhase, message);
        startExternalLlmTimer(
          Date.parse(state.startedAt || state.at || ""),
          heartbeatAt,
          state.phase
        );
      } else if (state.phase === "done" || state.phase === "skipped") {
        clearExternalLlmTimer();
        setStatus("success", message);
        setConnectionState("success", state.phase === "done" ? "日内调整已完成" : "本次无需调整");
        if (llmProgressOverlay && llmProgressBusy) {
          setLlmProgressStep("done", message);
          llmProgressBusy = false;
          llmProgressClose.disabled = false;
          llmProgressClose.textContent = "关闭";
          if (llmProgressOverlay.classList.contains("hidden")) window.setTimeout(hideLlmTaskChip, 5000);
          else window.setTimeout(closeLlmProgress, 1800);
        }
      } else if (state.phase === "error") {
        clearExternalLlmTimer();
        setStatus("error", `日内待办调整失败：${message}`);
        setConnectionState("error", "日内调整失败");
        if (restoreOverlay && recent && llmProgressOverlay) {
          if (!llmProgressBusy && llmProgressOverlay.classList.contains("hidden")) openLlmProgress("日内待办调整失败", "", "sent");
          setLlmProgressError(message);
          llmProgressBusy = false;
          llmProgressClose.disabled = false;
          llmProgressClose.textContent = "关闭";
        }
      }
    }
  }

  function readFormConfig() {
    return {
      token: elements.token.value,
      workspaceParentPageId: elements.workspaceParent.value,
      timeRecordSourceId: elements.timeRecordSource.value,
      weeklyPlanSourceId: elements.weeklyPlanSource.value,
      planningProfileSourceId: elements.planningProfileSource.value,
      dailyPlanSourceId: elements.dailyPlanSource.value,
      dailyReviewSourceId: elements.dailyReviewSource.value,
      dailyArchiveSourceId: elements.dailyArchiveSource.value,
      autoSync: elements.autoSync.checked,
      syncIntervalMinutes: elements.syncIntervalMinutes.value,
      dailyReviewEnabled: elements.dailyReviewEnabled.checked,
      intradayAdjustmentEnabled: elements.intradayAdjustmentEnabled.checked,
      dailyReviewTime: elements.dailyReviewTime.value,
      llmEndpoint: elements.llmEndpoint.value,
      llmModel: elements.llmModel.value,
      llmApiKey: elements.llmApiKey.value,
    };
  }

  async function persistFormConfig() {
    const config = await api.saveConfig(readFormConfig());
    await chrome.runtime.sendMessage({ type: "NOTION_CONFIG_UPDATED" }).catch(() => null);
    return config;
  }

  async function testConnection() {
    await runOperation("正在检查数据源权限和字段…", async () => {
      let config = await persistFormConfig();
      const result = await api.testConnections(config);
      if (!result.timeRecord) {
        throw new Error("请至少填写 Time Record 数据源。");
      }

      config = await api.saveConfig({
        ...config,
        timeRecordSourceId: result.timeRecord?.id || config.timeRecordSourceId,
        weeklyPlanSourceId: result.weeklyPlan?.id || config.weeklyPlanSourceId,
        planningProfileSourceId: result.planningProfile?.id || config.planningProfileSourceId,
        dailyPlanSourceId: result.dailyPlan?.id || config.dailyPlanSourceId,
        dailyReviewSourceId: result.dailyReview?.id || config.dailyReviewSourceId,
        dailyArchiveSourceId: result.dailyArchive?.id || config.dailyArchiveSourceId,
      });
      elements.timeRecordSource.value = config.timeRecordSourceId;
      elements.weeklyPlanSource.value = config.weeklyPlanSourceId;
      elements.planningProfileSource.value = config.planningProfileSourceId;
      elements.dailyPlanSource.value = config.dailyPlanSourceId;
      elements.dailyReviewSource.value = config.dailyReviewSourceId;
      elements.dailyArchiveSource.value = config.dailyArchiveSourceId;
      setConnectionState("success", "Notion 连接正常");

      const lines = Object.entries(result).map(([key, source]) => {
        const label = ({ timeRecord: "Time Record", weeklyPlan: "Phase Plan", planningProfile: "Planning Profile", dailyPlan: "Daily Todo", dailyReview: "Daily Review", dailyArchive: "Daily Archive" })[key];
        const warning = source.warnings?.length ? `\n  提示：${source.warnings.join("；")}` : "";
        return `${label}：${source.name}（${Object.keys(source.properties).length} 个字段）${warning}`;
      });
      return `连接成功。\n${lines.join("\n")}`;
    });
  }

  async function initializeWorkspace() {
    elements.progress.classList.remove("hidden");
    updateProgress(0, 6, "准备检查工作区…");
    await runOperation("正在检查 Notion 工作区…", async () => {
      const config = await persistFormConfig();
      const result = await api.initializeWorkspace(config, ({ index, total, kind, phase }) => {
        const label = ({ timeRecord: "Time Record", weeklyPlan: "Phase Plan", planningProfile: "Planning Profile", dailyPlan: "Daily Todo", dailyReview: "Daily Review", dailyArchive: "Daily Archive" })[kind];
        const action = phase === "creating" ? "正在创建" : phase === "done" ? "已完成" : "正在检查";
        updateProgress(index, total, `${action} ${label}…`);
      });
      elements.timeRecordSource.value = result.config.timeRecordSourceId;
      elements.weeklyPlanSource.value = result.config.weeklyPlanSourceId;
      elements.planningProfileSource.value = result.config.planningProfileSourceId;
      elements.dailyPlanSource.value = result.config.dailyPlanSourceId;
      elements.dailyReviewSource.value = result.config.dailyReviewSourceId;
      elements.dailyArchiveSource.value = result.config.dailyArchiveSourceId;
      renderWorkspaceResult(result.databases);
      updateProgress(6, 6, "工作区初始化完成");
      setConnectionState("success", "Notion 工作区已就绪");

      const today = elements.planDate.value || notionDateKey(new Date());
      const todos = await api.loadDailyTodos(today, result.config);
      const weeklyPlan = await api.loadWeeklyPlan(today, result.config);
      renderTodos(todos);
      renderWeeklyPlan(weeklyPlan);
      elements.dailyCompletion.value = await api.loadDailyCompletion(today, result.config);
      await loadProfile(result.config, true);
      await chrome.runtime.sendMessage({ type: "NOTION_CONFIG_UPDATED" }).catch(() => null);
      const created = Object.values(result.databases).filter((item) => item.action === "created").length;
      const loaded = Object.values(result.databases).length - created;
      return `初始化完成：载入/升级已有 ${loaded} 个，新建 ${created} 个数据库；已读取今日待办 ${todos.length} 条。`;
    });
  }

  function renderWorkspaceResult(databases) {
    const labels = { timeRecord: "Time Record", weeklyPlan: "Phase Plan", planningProfile: "Planning Profile", dailyPlan: "Daily Todo", dailyReview: "Daily Review", dailyArchive: "Daily Archive" };
    elements.workspaceResult.innerHTML = Object.entries(databases).map(([kind, item]) => {
      const recentTitles = (item.recent || []).map((page) => {
        const entries = Object.entries(page.properties || {});
        const title = entries.find(([name]) => /标题|计划|名称|title|name|plan/i.test(name)) || entries[0];
        return String(title?.[1] || "未命名");
      });
      return `
        <div class="notion-workspace-item">
          <span>
            <strong>${labels[kind]}</strong> · ${{ created: "已新建", upgraded: "已升级字段", loaded: "已载入" }[item.action] || "已载入"}
            ${recentTitles.length ? `<small>最近：${recentTitles.map(escapeNotionHtml).join("、")}</small>` : ""}
          </span>
          <em>${Number(item.historyCount) || 0} 条历史记录</em>
        </div>
      `;
    }).join("");
    elements.workspaceResult.classList.remove("hidden");
  }

  async function refreshWriteQueueState() {
    if (!elements.notionQueueChip) return;
    const state = await api.getWriteQueueState();
    const pending = Number(state.pending || 0);
    if (!pending && state.status !== "syncing") {
      elements.notionQueueChip.classList.add("hidden");
      return;
    }
    const displayState = state.status === "error" ? "error" : state.status === "syncing" ? "syncing" : "pending";
    elements.notionQueueChip.dataset.state = displayState;
    elements.notionQueueChip.classList.remove("hidden");
    elements.notionQueueChip.disabled = displayState === "syncing";
    const text = displayState === "syncing"
      ? `正在同步 ${pending} 项`
      : displayState === "error"
        ? `${pending} 项同步失败 · 点击重试`
        : `${pending} 项待同步 · 点击立即同步`;
    elements.notionQueueChipText.textContent = text;
    elements.notionQueueChip.title = state.lastError
      ? `上次错误：${state.lastError}`
      : "点击立即把本地待同步修改写入 Notion";
  }

  async function flushPendingWrites(config, { failOnError = true } = {}) {
    const before = await api.getWriteQueueState();
    if (!before.pending) return { total: 0, succeeded: 0, failed: 0, errors: [] };
    const summary = await api.flushWriteQueue(config);
    await refreshWriteQueueState();
    if (summary.skipped && failOnError) {
      throw new Error("另一个插件页面或后台任务正在写入 Notion，请稍后再试。");
    }
    if (failOnError && summary.failed) {
      throw new Error(`有 ${summary.failed} 项本地修改未能写入 Notion：${summary.errors[0]?.message || "请稍后重试"}`);
    }
    return summary;
  }

  async function flushPendingWritesNow() {
    await runOperation("正在把本地修改写入 Notion…", async () => {
      const config = await api.getConfig();
      const summary = await flushPendingWrites(config);
      if (!summary.total) return "当前没有待同步修改。";
      await refreshVisiblePlanningData(config);
      return `已写入 ${summary.succeeded} 项本地修改。`;
    }, { trigger: elements.notionQueueChip });
  }

  async function refreshVisiblePlanningData(config) {
    if (!document.getElementById("todayView")?.classList.contains("hidden")) {
      const today = visibleTodayDateKey();
      await Promise.all([loadWeekFlow([today]), loadGridTodos([today], config)]);
      return;
    }
    const keys = currentWeekDateKeys();
    if (!document.getElementById("textView")?.classList.contains("hidden")) await loadWeekFlow(keys);
    else if (!document.getElementById("gridView")?.classList.contains("hidden")) {
      await loadGridTodos(keys, config);
    } else if (!document.getElementById("phasePlansView")?.classList.contains("hidden")) {
      await loadAllPhasePlans(config);
    }
  }

  async function syncRecords(scope) {
    elements.progress.classList.remove("hidden");
    updateProgress(0, 1, "准备同步…");
    await runOperation(scope === "week" ? "正在同步本周记录…" : "正在同步全部记录…", async () => {
      const config = await persistFormConfig();
      updateProgress(0, 1, "正在写入本地待同步修改…");
      const queueSummary = await flushPendingWrites(config);
      updateProgress(0, 1, "正在拉取 Notion 修改…");
      const pullSummary = await api.pullTimeRecordsFromNotion(config);
      const onProgress = ({ index, total, summary }) => {
        updateProgress(index, total || 1, `已处理 ${index}/${total} · 新建 ${summary.created} · 更新 ${summary.updated}`);
      };
      let summary;
      if (scope === "week") {
        const [startKey, endKey] = currentWeekRange();
        summary = await api.syncDateRange(startKey, endKey, { config, onProgress });
      } else {
        summary = await api.syncAllLocalRecords({ config, onProgress });
      }
      updateProgress(summary.total || 1, summary.total || 1, "同步完成");
      elements.syncMeta.textContent = `上次同步：${formatLocalDateTime(new Date().toISOString())}`;
      setConnectionState(summary.failed ? "error" : "success", summary.failed ? "部分同步失败" : "同步正常");
      const message = `同步完成：写入本地修改 ${queueSummary.succeeded || 0}，拉取修改 ${pullSummary.updated || 0}，同步远端删除 ${pullSummary.deleted || 0}，新建 ${summary.created}，更新 ${summary.updated}，未变化 ${summary.unchanged}，失败 ${summary.failed}。`;
      return summary.errors.length
        ? `${message}\n${summary.errors.slice(0, 3).map((item) => item.message).join("\n")}`
        : message;
    });
  }

  async function loadPlan() {
    await loadPlanningContext({ silent: false });
  }

  async function loadPlanningContext({ silent = false } = {}) {
    const operation = async () => {
      const config = await persistFormConfig();
      const dateKey = elements.planDate.value || notionDateKey(new Date());
      const [todos, phasePlan, completion] = await Promise.all([
        api.loadDailyTodos(dateKey, config),
        api.loadPhasePlan(dateKey, config),
        api.loadDailyCompletion(dateKey, config),
      ]);
      renderTodos(todos);
      renderWeeklyPlan(phasePlan);
      elements.dailyCompletion.value = completion;
      return todos.length ? `已读取 ${todos.length} 条待办。` : "该日期没有待办记录。";
    };
    if (silent) {
      try {
        await operation();
      } catch (error) {
        console.warn("Unable to preload planning context", error);
      }
      return;
    }
    await runOperation("正在读取待办、阶段计划和完成情况…", operation);
  }

  function currentWeekDateKeys() {
    const keys = [...document.querySelectorAll("[data-flow-date]")]
      .map((card) => card.dataset.flowDate)
      .filter(Boolean);
    return keys.length ? keys : [notionDateKey(new Date())];
  }

  async function loadWeekFlow(dateKeys, options = {}) {
    const requestSequence = ++flowLoadSequence;
    const keys = [...new Set((dateKeys || []).filter(Boolean))];
    if (!keys.length) return;
    const config = await api.getConfig();
    if (!config.token || !config.dailyPlanSourceId) {
      for (const key of keys) renderFlowUnavailable(key, "请先在“配置”中连接并初始化 Notion 工作区");
      return;
    }
    const cache = await readPlanningCache(config);
    let hasCachedContent = false;
    for (const key of keys) {
      const todos = cache.todos[key]?.value;
      const review = cache.reviews[key]?.value;
      const archive = cache.archives[key]?.value;
      if (todos || review || archive) {
        renderFlowDayData(key, todos || [], review || { date: key }, archive || null, config, true);
        hasCachedContent = true;
      } else {
        setFlowDayLoading(key);
      }
    }
    if (hasCachedContent) setFlowOperationStatus("working", "已显示本地缓存，正在后台与 Notion 同步…");
    if (options.cacheOnly) {
      selectedFlowDate = preferredFlowDate(keys);
      applySelectedFlowCard();
      return;
    }

    let refreshFailed = false;
    for (const key of keys) {
      if (requestSequence !== flowLoadSequence) return;
      try {
        await loadFlowDay(key, config, {
          shouldCommit: () => requestSequence === flowLoadSequence,
        });
      } catch (error) {
        refreshFailed = true;
        if (!cache.todos[key] && !cache.reviews[key] && !cache.archives[key]) {
          renderFlowUnavailable(key, friendlyError(error));
        }
      }
    }
    if (requestSequence !== flowLoadSequence) return;
    selectedFlowDate = preferredFlowDate(keys);
    applySelectedFlowCard();
    if (hasCachedContent) {
      setFlowOperationStatus(
        refreshFailed ? "error" : "success",
        refreshFailed ? "Notion 后台刷新失败，已保留上次本地缓存" : "Notion 后台同步已完成"
      );
    }
  }

  async function loadGridTodos(dateKeys, configInput) {
    const requestSequence = ++gridLoadSequence;
    const keys = [...new Set((dateKeys || []).filter(Boolean))];
    if (!keys.length) return;
    const config = configInput || await api.getConfig();
    const cache = await readPlanningCache(config);
    const todosByDate = {};
    let hasCachedTodos = false;
    for (const dateKey of keys) {
      if (cache.todos[dateKey]) {
        todosByDate[dateKey] = cache.todos[dateKey].value || [];
        hasCachedTodos = true;
      }
    }
    if (hasCachedTodos) {
      if (requestSequence !== gridLoadSequence) return;
      window.dispatchEvent(new CustomEvent("minimal-pomodoro-grid-todos", { detail: { todosByDate: { ...todosByDate } } }));
    }
    if (config.token && config.dailyPlanSourceId) {
      const results = await Promise.all(keys.map(async (dateKey) => {
        try {
          return [dateKey, await api.loadDailyTodos(dateKey, config), true];
        } catch (error) {
          console.warn(`Unable to load planned todos for ${dateKey}`, error);
          return [dateKey, todosByDate[dateKey] || [], false];
        }
      }));
      if (requestSequence !== gridLoadSequence) return;
      for (const [dateKey, todos] of results) {
        todosByDate[dateKey] = await autoCompleteTodosForDate(dateKey, todos, config);
      }
      await queuePlanningCacheUpdate(config, (nextCache) => {
        for (const [dateKey, , succeeded] of results) {
          if (succeeded) nextCache.todos[dateKey] = cacheEntry(todosByDate[dateKey]);
        }
      });
    } else {
      for (const dateKey of keys) todosByDate[dateKey] = [];
    }
    if (requestSequence === gridLoadSequence) {
      window.dispatchEvent(new CustomEvent("minimal-pomodoro-grid-todos", { detail: { todosByDate } }));
    }
  }

  async function loadFlowDay(dateKey, configInput, options = {}) {
    const config = configInput || await api.getConfig();
    let [todos, review, archive] = await Promise.all([
      api.loadDailyTodos(dateKey, config),
      api.loadDailyReview(dateKey, config),
      api.loadDailyArchive(dateKey, config),
    ]);
    todos = await autoCompleteTodosForDate(dateKey, todos, config);
    if (options.shouldCommit && !options.shouldCommit()) return { todos, review, archive, stale: true };
    renderFlowDayData(dateKey, todos, review, archive, config, false);
    await queuePlanningCacheUpdate(config, (cache) => {
      if (options.shouldCommit && !options.shouldCommit()) return;
      cache.todos[dateKey] = cacheEntry(todos);
      cache.reviews[dateKey] = cacheEntry(review);
      cache.archives[dateKey] = cacheEntry(archive);
    });
    return { todos, review, archive };
  }

  async function autoCompleteTodosForDate(dateKey, todos, config) {
    const cachedTodos = flowTodosByDate.get(dateKey) || (await readPlanningCache(config)).todos[dateKey]?.value || [];
    const localById = new Map(cachedTodos.map((todo) => [todo.id || todo.externalId, todo]));
    const pendingTodoKeys = await pendingTodoQueueKeys(dateKey);
    const sourceTodos = (Array.isArray(todos) ? todos : []).map((todo) => {
      const local = localById.get(todo.id || todo.externalId);
      return local?.pendingSync && todoHasPendingQueueEntry(todo, pendingTodoKeys)
        ? { ...todo, ...local }
        : { ...todo, pendingSync: false };
    });
    const candidates = sourceTodos.filter((todo) => todo.status !== "done" && todo.plannedStart && todo.plannedEnd);
    if (!candidates.length) return sourceTodos;
    const records = (await api.loadAllLocalRecords()).filter((record) => (
      record.dateKey === dateKey && record.type === "work" && record.end != null && !record.autoFilled &&
      record.todoAutoCompleteEligible !== false && record.automatic !== false
    ));
    if (!records.length) return sourceTodos;
    const completedIds = new Set();
    for (const todo of candidates) {
      const matchedMinutes = records
        .filter((record) => todoTitleMatchesRecord(todo, record))
        .reduce((sum, record) => sum + recordDurationMinutes(record), 0);
      if (matchedMinutes > 0 && matchedMinutes >= todoAutoCompleteThresholdMinutes(todo)) completedIds.add(todo.id);
    }
    if (!completedIds.size) return sourceTodos;
    const next = sourceTodos.map((todo) => completedIds.has(todo.id) ? { ...todo, status: "done", pendingSync: true } : todo);
    for (const todo of next) {
      if (completedIds.has(todo.id)) await api.queueDailyTodoUpsert(dateKey, todo);
    }
    await storeLocalTodos(dateKey, next, config);
    return next;
  }

  function renderFlowDayData(dateKey, todos, review, archive, config, fromCache = false) {
    if (!fromCache && review.lifeRecord) window.DailyLifeRecords?.acceptRemote(dateKey, review.lifeRecord).catch(() => {});
    flowTodosByDate.set(dateKey, todos);
    renderFlowTodos(dateKey, todos);
    renderFlowReview(dateKey, review, archive, Boolean(config.dailyArchiveSourceId));
    for (const completion of flowElements(dateKey, "completion")) {
      if (document.activeElement !== completion) completion.value = review.userCompletion || "";
    }
    setCompletionSaveState(
      dateKey,
      review.pendingSync ? "pending" : review.userCompletion || review.id ? "saved" : "idle",
      review.pendingSync
        ? `${review.userCompletion ? "已保存" : "已清空"}到本地 · 等待同步`
        : review.userCompletion
          ? `${fromCache ? "已从本地缓存显示" : "已从 Notion 读取"}${review.duplicateCount ? ` · 检测到 ${review.duplicateCount} 条同日旧记录，已合并显示` : ""}`
          : review.id ? "Notion 中的完成情况当前为空" : "修改后请点击保存，内容会先保存到本地"
    );
  }

  async function updateLocalTodoCache(dateKey, todoId, updates, configInput) {
    if (!dateKey || !todoId) return;
    const config = configInput || await api.getConfig();
    const current = flowTodosByDate.get(dateKey) || (await readPlanningCache(config)).todos[dateKey]?.value || [];
    if (!current.some((todo) => todo.id === todoId || todo.externalId === todoId)) return;
    const next = current.map((todo) => todo.id === todoId || todo.externalId === todoId ? { ...todo, ...updates, pendingSync: true } : todo);
    await storeLocalTodos(dateKey, next, config);
  }

  async function upsertLocalTodoCache(dateKey, todo, configInput) {
    const config = configInput || await api.getConfig();
    const current = flowTodosByDate.get(dateKey) || (await readPlanningCache(config)).todos[dateKey]?.value || [];
    const index = current.findIndex((item) => item.id === todo.id || (todo.externalId && item.externalId === todo.externalId));
    const next = [...current];
    if (index >= 0) next[index] = { ...next[index], ...todo, pendingSync: true };
    else next.push({ ...todo, pendingSync: true });
    await storeLocalTodos(dateKey, next, config);
    return next[index >= 0 ? index : next.length - 1];
  }

  async function removeLocalTodoCache(dateKey, todo, configInput) {
    const config = configInput || await api.getConfig();
    const current = flowTodosByDate.get(dateKey) || (await readPlanningCache(config)).todos[dateKey]?.value || [];
    const next = current.filter((item) => item.id !== todo.id && (!todo.externalId || item.externalId !== todo.externalId));
    await storeLocalTodos(dateKey, next, config);
  }

  async function storeLocalTodos(dateKey, next, config) {
    flowTodosByDate.set(dateKey, next);
    if (elements.planDate.value === dateKey) {
      currentTodos = next;
      renderTodos(next);
    }
    if (flowCard(dateKey)) renderFlowTodos(dateKey, next);
    await queuePlanningCacheUpdate(config, (cache) => {
      cache.todos[dateKey] = cacheEntry(next);
    });
    window.dispatchEvent(new CustomEvent("minimal-pomodoro-grid-todos", { detail: { todosByDate: { [dateKey]: next }, merge: true } }));
  }

  async function pendingTodoQueueKeys(dateKey) {
    const queued = typeof api.getQueuedWrites === "function" ? await api.getQueuedWrites() : [];
    return new Set(
      queued
        .filter((operation) => operation.payload?.dateKey === dateKey && ["todo_upsert", "todo_delete"].includes(operation.kind))
        .flatMap((operation) => {
          const todo = operation.payload?.todo || {};
          return [
            todo.id,
            todo.externalId,
            operation.payload?.externalId,
            operation.payload?.pageId,
            String(operation.entityKey || "").split(":").slice(1).join(":"),
          ].filter(Boolean).map(String);
        })
    );
  }

  function todoHasPendingQueueEntry(todo, pendingTodoKeys) {
    return [todo.id, todo.externalId].filter(Boolean).some((key) => pendingTodoKeys.has(String(key)));
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

  async function updateLocalReviewCache(dateKey, updates, configInput) {
    const config = configInput || await api.getConfig();
    const cache = await readPlanningCache(config);
    const review = { date: dateKey, ...(cache.reviews[dateKey]?.value || {}), ...updates, pendingSync: true };
    const todos = flowTodosByDate.get(dateKey) || cache.todos[dateKey]?.value || [];
    const archive = cache.archives[dateKey]?.value || null;
    renderFlowDayData(dateKey, todos, review, archive, config, true);
    await queuePlanningCacheUpdate(config, (nextCache) => {
      nextCache.reviews[dateKey] = cacheEntry(review);
    });
    return review;
  }

  async function loadPhaseForDate(dateKey, configInput) {
    const config = configInput || await api.getConfig();
    if (!config.token || !config.weeklyPlanSourceId) {
      renderWeeklyPlan(null);
      return;
    }
    const cache = await readPlanningCache(config);
    if (cache.phasesByDate[dateKey]) renderWeeklyPlan(cache.phasesByDate[dateKey].value);
    const plan = await api.loadPhasePlan(dateKey, config);
    renderWeeklyPlan(plan);
    await queuePlanningCacheUpdate(config, (nextCache) => {
      nextCache.phasesByDate[dateKey] = cacheEntry(plan);
    });
  }

  async function loadAllPhasePlans(configInput) {
    if (!elements.phasePlansDatabase) return [];
    const config = configInput || await api.getConfig();
    if (!config.token || !config.weeklyPlanSourceId) {
      renderPhaseDatabaseError("请先在“配置”中连接 Notion Phase Plan 数据源。");
      return [];
    }
    elements.phasePlansStatus?.classList.remove("hidden");
    if (elements.phasePlansStatus) {
      elements.phasePlansStatus.dataset.state = "working";
      elements.phasePlansStatus.textContent = "正在从 Notion 读取阶段计划…";
    }
    allPhasePlans = await api.loadAllPhasePlans(config);
    renderPhaseDatabase(allPhasePlans);
    if (elements.phasePlansStatus) {
      elements.phasePlansStatus.dataset.state = "success";
      elements.phasePlansStatus.textContent = `已读取 ${allPhasePlans.length} 个阶段计划`;
    }
    return allPhasePlans;
  }

  function renderPhaseDatabaseError(message) {
    if (elements.phasePlansDatabase) {
      elements.phasePlansDatabase.innerHTML = `<div class="notion-empty">${escapeNotionHtml(message)}</div>`;
    }
    if (elements.phasePlansStatus) {
      elements.phasePlansStatus.dataset.state = "error";
      elements.phasePlansStatus.textContent = message;
      elements.phasePlansStatus.classList.remove("hidden");
    }
  }

  function renderPhaseDatabase(plans) {
    if (!elements.phasePlansDatabase) return;
    document.getElementById("phasePlanCount").textContent = `${plans.length} 个计划`;
    if (!plans.length) {
      elements.phasePlansDatabase.innerHTML = '<div class="notion-empty">还没有阶段计划，点击“新增阶段计划”开始创建。</div>';
      return;
    }
    const today = notionDateKey(new Date());
    elements.phasePlansDatabase.innerHTML = plans.map((plan) => {
      const milestones = Array.isArray(plan.milestones) ? plan.milestones : [];
      const current = plan.startDate <= today && today <= plan.endDate && plan.status !== "completed";
      const statusLabel = current ? "进行中" : plan.status === "completed" || plan.endDate < today ? "已结束" : "未开始";
      return `
        <article class="phase-database-card${current ? " is-current" : ""}" data-phase-state="${current ? "active" : statusLabel === "已结束" ? "completed" : "upcoming"}" data-phase-page-id="${escapeNotionHtml(plan.id)}" data-notion-url="${escapeNotionHtml(plan.url || "")}">
          <header>
            <div><span>${escapeNotionHtml(statusLabel)}</span><h3>${escapeNotionHtml(plan.title || "阶段计划")}</h3></div>
            <time>${escapeNotionHtml(plan.startDate)} → ${escapeNotionHtml(plan.endDate)}</time>
          </header>
          <p>${escapeNotionHtml(plan.description || "未填写计划描述")}</p>
          <div class="phase-database-meta"><span>${milestones.length} 个每日里程碑</span>${plan.finalSummary ? "<span>已生成阶段总结</span>" : ""}</div>
          <div class="phase-database-actions">
            <button class="ghost" type="button" data-phase-db-detail>查看详情</button>
            <details class="inline-menu"><summary data-icon="ellipsis" aria-label="更多计划操作" title="更多计划操作"></summary><div><button class="ghost" type="button" data-phase-db-edit data-icon="pencil">编辑</button><button class="danger" type="button" data-phase-db-delete data-icon="trash-2">删除</button></div></details>
          </div>
          <div class="phase-database-detail hidden">
            <section class="phase-detail-section">
              <strong>阶段总结</strong>
              ${plan.finalSummary ? renderPhaseSummaryBlocks(plan.finalSummary) : '<p>尚未生成阶段总结。</p>'}
            </section>
            <section class="phase-detail-section">
              <strong>每日计划</strong>
              ${milestones.length ? `<ol>${milestones.map((item) => `<li><time>${escapeNotionHtml(item.date || "")}</time><span>${escapeNotionHtml(item.goal || "未命名里程碑")}${Number(item.estimatedMinutes) > 0 ? ` · 预计 ${escapeNotionHtml(item.estimatedMinutes)} 分钟` : ""}${renderMilestoneProgress(item)}</span></li>`).join("")}</ol>` : '<p>尚无 LLM 拆分结果。</p>'}
            </section>
            <section class="phase-detail-section">
              <strong>约束与说明</strong>
              <p>${escapeNotionHtml(plan.constraints || "未填写约束。")}</p>
            </section>
          </div>
        </article>`;
    }).join("");
  }

  function renderPhaseSummaryBlocks(summary) {
    const knownHeading = /^(主要成果|阶段成果|完成情况|计划偏差|未完成事项|问题与原因|下一步|后续计划|阶段回顾|本阶段总结)[：:]?\s*(.*)$/;
    const blocks = [];
    let listOpen = false;
    for (const raw of String(summary || "").split(/\r?\n/)) {
      const line = raw.trim();
      if (!line) { if (listOpen) { blocks.push("</ul>"); listOpen = false; } continue; }
      const markdown = line.match(/^#{1,6}\s+(.+)$/);
      const cleaned = line.replace(/^\*\*(.+)\*\*$/, "$1");
      const heading = cleaned.match(knownHeading);
      const item = line.match(/^(?:[-*]\s+|\d+[.)、]\s*)(.+)$/);
      if (heading || markdown) {
        if (listOpen) { blocks.push("</ul>"); listOpen = false; }
        blocks.push(`<h4>${escapeNotionHtml(markdown ? markdown[1] : heading[1])}</h4>`);
        if (heading?.[2]) blocks.push(`<p>${escapeNotionHtml(heading[2])}</p>`);
      } else if (item) {
        if (!listOpen) { blocks.push("<ul>"); listOpen = true; }
        blocks.push(`<li>${escapeNotionHtml(item[1])}</li>`);
      } else {
        if (listOpen) { blocks.push("</ul>"); listOpen = false; }
        blocks.push(`<p>${escapeNotionHtml(line)}</p>`);
      }
    }
    if (listOpen) blocks.push("</ul>");
    return `<div class="phase-final-summary">${blocks.join("")}</div>`;
  }

  function handlePhaseDatabaseAction(event) {
    const card = event.target.closest("[data-phase-page-id]");
    if (!card) return;
    const plan = allPhasePlans.find((item) => item.id === card.dataset.phasePageId);
    if (!plan) return;
    if (event.target.closest("[data-phase-db-detail]")) {
      globalThis.PersonalSystemWorkspace?.showPhaseDetails(card, plan);
      return;
    }
    if (event.target.closest("[data-phase-db-edit]")) return openPhaseMetadataEditor(plan);
    if (event.target.closest("[data-phase-db-delete]")) return removePhasePlan(plan);
  }

  function openPhaseMetadataEditor(plan) {
    editingPhasePlan = plan;
    elements.phasePlanForm.classList.add("hidden");
    elements.phaseAdjustBox.classList.add("hidden");
    phaseSummaryChoice.classList.add("hidden");
    phaseMetadataForm.classList.remove("hidden");
    phaseMetadataForm.elements.title.value = plan.title || "";
    phaseMetadataForm.elements.status.value = plan.status === "completed" ? "completed" : "active";
    phaseMetadataForm.elements.startDate.value = plan.startDate || "";
    phaseMetadataForm.elements.endDate.value = plan.endDate || "";
    phaseMetadataForm.elements.description.value = plan.description || "";
    phaseMetadataForm.elements.constraints.value = plan.constraints || "";
    phaseEditorTitle.textContent = "编辑阶段计划";
    phaseEditorDescription.textContent = "修改基本信息和日期范围；已有 LLM 每日里程碑不会被自动改写。";
    phaseEditorOverlay.classList.remove("hidden");
    document.body.classList.add("todo-editor-open");
    window.setTimeout(() => phaseMetadataForm.elements.title.focus(), 0);
  }

  async function savePhaseMetadata(event) {
    event.preventDefault();
    if (!editingPhasePlan) return;
    await runOperation("正在保存阶段计划…", async () => {
      const startDate = phaseMetadataForm.elements.startDate.value;
      const endDate = phaseMetadataForm.elements.endDate.value;
      if (!startDate || !endDate || endDate < startDate) throw new Error("结束日期不能早于开始日期。");
      const config = await api.getConfig();
      await flushPendingWrites(config);
      const saved = await api.updatePhasePlanMetadata(editingPhasePlan, {
        title: phaseMetadataForm.elements.title.value.trim(),
        status: phaseMetadataForm.elements.status.value,
        startDate,
        endDate,
        description: phaseMetadataForm.elements.description.value,
        constraints: phaseMetadataForm.elements.constraints.value,
      }, config);
      editingPhasePlan = null;
      await clearPhasePlanningCache(config);
      closePhaseEditor();
      await refreshPhasePlanSurfaces(config);
      return `阶段计划“${saved.title}”已更新并同步到 Notion。`;
    }, { trigger: event.submitter });
  }

  async function removePhasePlan(plan) {
    if (!confirm(`删除阶段计划“${plan.title}”？\n\nNotion 中的计划页面会移入回收站，相关日期的待办、日报和归档会解除阶段计划绑定。`)) return;
    await runOperation("正在删除阶段计划…", async () => {
      const config = await api.getConfig();
      await flushPendingWrites(config);
      await api.deletePhasePlan(plan, config);
      await clearPhasePlanningCache(config);
      await refreshPhasePlanSurfaces(config);
      return `阶段计划“${plan.title}”已移入 Notion 回收站。`;
    });
  }

  function clearPhasePlanningCache(config) {
    return queuePlanningCacheUpdate(config, (cache) => {
      cache.phasesByDate = {};
      cache.phaseRanges = {};
      cache.todos = {};
      cache.reviews = {};
      cache.archives = {};
    });
  }

  async function refreshPhasePlanSurfaces(configInput) {
    const config = configInput || await api.getConfig();
    if (!document.getElementById("phasePlansView")?.classList.contains("hidden")) await loadAllPhasePlans(config);
    const today = visibleTodayDateKey();
    if (!document.getElementById("todayView")?.classList.contains("hidden")) await loadPhaseForDate(today, config);
  }

  function flowCard(dateKey) {
    return flowCards(dateKey).find((card) => !card.closest(".hidden")) || flowCards(dateKey)[0] || null;
  }

  function flowCards(dateKey) {
    const selector = `[data-flow-date="${CSS.escape(dateKey)}"]`;
    return [elements.todayFlowGrid, elements.weekFlowGrid]
      .flatMap((container) => container ? [...container.querySelectorAll(selector)] : []);
  }

  function flowElement(dateKey, role) {
    return flowCard(dateKey)?.querySelector(`[data-flow-role="${role}"]`) || null;
  }

  function flowElements(dateKey, role) {
    return flowCards(dateKey)
      .map((card) => card.querySelector(`[data-flow-role="${role}"]`))
      .filter(Boolean);
  }

  function setFlowDayLoading(dateKey) {
    for (const list of flowElements(dateKey, "todos")) list.innerHTML = '<div class="flow-empty">正在同步待办…</div>';
    for (const review of flowElements(dateKey, "review")) review.innerHTML = '<div class="flow-empty">正在读取总结…</div>';
  }

  function renderFlowUnavailable(dateKey, message) {
    const safe = escapeNotionHtml(message);
    for (const list of flowElements(dateKey, "todos")) list.innerHTML = `<div class="flow-empty">${safe}</div>`;
    for (const review of flowElements(dateKey, "review")) review.innerHTML = `<div class="flow-empty">${safe}</div>`;
  }

  function renderFlowTodos(dateKey, todos) {
    const lists = flowElements(dateKey, "todos");
    if (!lists.length) return;
    for (const llmButton of flowCards(dateKey).map((card) => card.querySelector('[data-flow-action="adjust-todos"], [data-flow-action="generate-todos"]')).filter(Boolean)) {
      llmButton.dataset.flowAction = todos.length ? "adjust-todos" : "generate-todos";
      llmButton.textContent = todos.length ? "LLM 调整" : "LLM 生成待办";
      llmButton.title = todos.length
        ? "用自然语言调整当天待办"
        : "手动根据阶段计划生成；有前一日上下文时会一并参考";
    }
    if (!todos.length) {
      for (const list of lists) list.innerHTML = '<div class="flow-empty">当天没有待办，可点击“新增”创建</div>';
      return;
    }
    const sortedTodos = [...todos].sort(compareTodosBySchedule);
    const html = sortedTodos.map((todo) => {
      const priority = ({ high: "高", medium: "中", low: "低" })[todo.priority] || "中";
      const status = ({ pending: "待开始", in_progress: "进行中", done: "已完成" })[todo.status] || todo.status;
      return `
        <article class="flow-todo-item" tabindex="0" data-todo-id="${escapeNotionHtml(todo.id)}" data-priority="${escapeNotionHtml(todo.priority)}" data-status="${escapeNotionHtml(todo.status)}" data-notion-url="${escapeNotionHtml(todo.url || "")}">
          <label class="flow-todo-heading"><input class="flow-todo-check" type="checkbox" data-flow-action="toggle-todo" data-todo-id="${escapeNotionHtml(todo.id)}" ${todo.status === "done" ? "checked" : ""} aria-label="${escapeNotionHtml(`完成：${todo.title}`)}" /><strong>${escapeNotionHtml(todo.title)}${todo.pendingSync ? '<span class="pending-sync-badge">待同步</span>' : ""}</strong></label>
          <small>${escapeNotionHtml(formatTodoSchedule(todo))} · ${priority}优先级 · ${escapeNotionHtml(status)} · ${escapeNotionHtml(formatTodoEffort(todo))}</small>
        </article>`;
    }).join("");
    for (const list of lists) list.innerHTML = html;
  }

  function renderFlowReview(dateKey, review, archive, archiveConfigured = true) {
    const containers = flowElements(dateKey, "review");
    if (!containers.length) return;
    const parts = [
      ["总结", review.dailySummary],
      ["时间分析", review.timeAnalysis],
      ["问题分析", review.problemAnalysis],
      ["次日关注", review.nextFocus],
    ].filter(([, value]) => value);
    const html = parts.length
      ? parts.map(([label, value]) => `<div class="flow-review-block"><strong>${label}</strong><span>${escapeNotionHtml(value)}</span></div>`).join("")
      : '<div class="flow-empty">尚未生成总结</div>';
    for (const container of containers) {
      container.innerHTML = html;
      container.dataset.notionUrl = review.url || "";
      container.dataset.notionArchiveUrl = archive?.url || "";
    }
    for (const textarea of flowElements(dateKey, "completion")) textarea.dataset.notionUrl = review.url || "";
    for (const archiveButton of flowCards(dateKey).map((card) => card.querySelector('[data-flow-action="update-archive"]')).filter(Boolean)) {
      archiveButton.disabled = !review.dailySummary || !archiveConfigured;
      delete archiveButton.dataset.disabledBeforeOperation;
      archiveButton.title = !archiveConfigured
        ? "请先到配置页重新执行工作区初始化，以创建 Daily Archive"
        : review.dailySummary
          ? "用当前待办、时间流、完成情况和总结刷新 Notion 每日归档"
          : "请先生成当天总结";
    }
  }

  async function handleFlowAction(event) {
    const card = event.target.closest("[data-flow-date]");
    if (!card) return;
    const dateKey = card.dataset.flowDate;
    const selection = selectFlowDate(dateKey);
    const button = event.target.closest("[data-flow-action]");
    if (!button) return selection;
    const action = button.dataset.flowAction;
    elements.planDate.value = dateKey;
    currentTodos = flowTodosByDate.get(dateKey) || [];

    if (action === "new-todo") return openTodoEditor();
    if (action === "generate-todos") {
      return openScheduleDialog("generate", dateKey);
    }
    if (action === "adjust-todos") {
      return openScheduleDialog("adjust", dateKey);
    }
    if (action === "sync-day") {
      return runOperation(`正在同步 ${dateKey}…`, async () => {
        const config = await api.getConfig();
        const summary = await flushPendingWrites(config);
        await loadFlowDay(dateKey);
        await loadPhaseForDate(dateKey);
        return `${dateKey} 已与 Notion 同步，写入 ${summary.succeeded || 0} 项本地修改。`;
      });
    }
    if (action === "save-completion") {
      setCompletionSaveState(dateKey, "working", "正在保存到本地…");
      return runOperation("正在保存当天完成情况到本地…", async () => {
        try {
          const config = await api.getConfig();
          const completionText = card.querySelector('[data-flow-role="completion"]')?.value || "";
          await api.queueDailyCompletion(dateKey, completionText);
          await updateLocalReviewCache(dateKey, { userCompletion: completionText.trim() }, config);
          setCompletionSaveState(dateKey, "pending", `${completionText.trim() ? "已保存" : "已清空"}到本地 · 等待同步`);
          return `${dateKey} 完成情况已保存到本地，将在下次定时同步写入 Notion。`;
        } catch (error) {
          setCompletionSaveState(dateKey, "error", "保存失败，内容仍保留在编辑框中，请重试");
          throw error;
        }
      }, { trigger: button });
    }
    if (action === "generate-review") {
      return runOperation("正在生成总结和次日待办…", async (progress) => {
        const config = await api.getConfig();
        progress("sent", "正在先同步本地修改，确保 LLM 使用最新数据…");
        await flushPendingWrites(config);
        const phasePlan = await api.loadPhasePlan(dateKey, config);
        const completion = card.querySelector('[data-flow-role="completion"]')?.value?.trim();
        if (!completion && phasePlan?.startDate === dateKey) {
          progress("generating", "LLM 正在生成阶段计划首日待办…");
          const firstDay = await api.generateInitialDayTodos(dateKey, config, {
            requestedAt: new Date().toISOString(), preparationMinutes: 10,
          });
          progress("writing", "待办已生成，正在刷新 Notion 数据…");
          await loadFlowDay(dateKey, config);
          return `${dateKey} 是阶段计划第一天，已直接生成 ${firstDay.todoSummary.total} 条当天待办，无需前一日完成情况。`;
        }
        await api.saveDailyCompletion(dateKey, completion, config);
        progress("generating", "LLM 正在生成总结和次日待办…");
        const result = await api.triggerDailyReview(dateKey, config);
        progress("writing", "生成完成，正在确认 Notion 写入并刷新页面…");
        await loadFlowDay(dateKey, config);
        if (!result.nextTodoSkipped && flowCard(result.nextTodoDate)) await loadFlowDay(result.nextTodoDate, config);
        const archiveMessage = result.archive
          ? "；每日归档已写入 Notion"
          : result.archiveError ? `；每日归档写入失败：${result.archiveError}` : "";
        return result.nextTodoSkipped
          ? `${dateKey} 总结已生成${archiveMessage}；${result.nextTodoBlockedReason}，未生成次日待办。`
          : `${dateKey} 总结已生成；${result.nextTodoDate} 已同步 ${result.todoSummary.total} 条待办${archiveMessage}。`;
      }, { trigger: button, estimate: "通常需要 20–60 秒", llm: true });
    }
    if (action === "update-archive") {
      return runOperation("正在更新每日归档…", async () => {
        const config = await api.getConfig();
        await api.generateDailyArchive(dateKey, config);
        await loadFlowDay(dateKey, config);
        return `${dateKey} 每日归档已更新，可在 Notion 中查看。`;
      }, { trigger: button });
    }
    if (action === "export-day-md") {
      return runOperation("正在生成 Markdown 文件…", async () => {
        const config = await api.getConfig();
        const exported = await api.exportDailyArchiveMarkdown(dateKey, config);
        downloadMarkdown(exported.filename, exported.markdown);
        return `${exported.filename} 已导出。`;
      }, { trigger: button });
    }

    const todo = currentTodos.find((item) => item.id === button.dataset.todoId);
    if (!todo) return;
    if (action === "edit-todo") return openTodoEditor(todo);
    if (action === "toggle-todo") {
      button.disabled = true;
      await updateTodoStatus(todo.id, button.checked ? "done" : "pending");
      // A failed write must not leave an unsaved checkmark on screen.
      renderFlowTodos(dateKey, flowTodosByDate.get(dateKey) || []);
      return;
    }
    if (action === "done-todo") return updateTodoStatus(todo.id, "done");
    if (action === "delete-todo") return removeTodo(todo.id);
    if (action === "start-todo") return startTodo(todo);
  }

  function handleTodoMenuAction(event) {
    const { dateKey, todoId, action } = event.detail || {};
    const todo = (flowTodosByDate.get(dateKey) || []).find((item) => item.id === todoId);
    if (!todo) return;
    selectFlowDate(dateKey);
    elements.planDate.value = dateKey;
    currentTodos = flowTodosByDate.get(dateKey) || [];
    if (action === "start-todo") return startTodo(todo);
    if (action === "edit-todo") return openTodoEditor(todo);
    if (action === "delete-todo") return removeTodo(todo.id);
  }

  function handleFlowInput(event) {
    const completion = event.target.closest('[data-flow-role="completion"]');
    if (!completion) return;
    const card = completion.closest("[data-flow-date]");
    if (!card) return;
    for (const peer of flowElements(card.dataset.flowDate, "completion")) {
      if (peer !== completion) peer.value = completion.value;
    }
    setCompletionSaveState(card.dataset.flowDate, "dirty", "有尚未保存的修改");
  }

  function setCompletionSaveState(dateKey, state, message) {
    for (const status of flowElements(dateKey, "completion-status")) {
      status.dataset.state = state;
      status.textContent = message;
    }
    for (const button of flowCards(dateKey).map((card) => card.querySelector('[data-flow-action="save-completion"]')).filter(Boolean)) {
      button.dataset.state = state;
    }
  }

  function renderTodos(todos) {
    currentTodos = todos;
    if (!todos.length) {
      elements.planList.innerHTML = `<div class="notion-empty">该日期没有待办记录</div>`;
      return;
    }
    elements.planList.innerHTML = todos.map((todo) => {
      const priorityLabel = ({ high: "高", medium: "中", low: "低" })[todo.priority] || "中";
      const statusLabel = ({ pending: "待开始", in_progress: "进行中", done: "已完成" })[todo.status] || todo.status;
      return `
        <article class="notion-todo-item" data-priority="${escapeNotionHtml(todo.priority)}" data-status="${escapeNotionHtml(todo.status)}" data-notion-url="${escapeNotionHtml(todo.url || "")}">
          <div class="notion-todo-copy">
            <strong>${escapeNotionHtml(todo.title)}</strong>
            ${todo.details ? `<small>${escapeNotionHtml(todo.details)}</small>` : ""}
            <span>${priorityLabel}优先级 · ${escapeNotionHtml(statusLabel)} · ${formatTodoSchedule(todo)} · ${escapeNotionHtml(formatTodoEffort(todo))} · 已投入 ${todo.actualMinutes || 0} 分钟</span>
          </div>
          <div class="notion-todo-actions">
            <button class="ghost notion-edit-todo" type="button" data-todo-id="${escapeNotionHtml(todo.id)}">编辑</button>
            ${todo.status !== "done" ? `<button class="ghost notion-done-todo" type="button" data-todo-id="${escapeNotionHtml(todo.id)}">完成</button>` : ""}
            <button class="ghost notion-delete-todo" type="button" data-todo-id="${escapeNotionHtml(todo.id)}">删除</button>
            <button class="primary notion-start-todo" type="button"
              data-todo-id="${escapeNotionHtml(todo.id)}"
              data-todo-url="${escapeNotionHtml(todo.url || "")}"
              data-todo-date="${escapeNotionHtml(todo.date)}"
              data-planned-start="${escapeNotionHtml(todo.plannedStart || "")}"
              data-planned-end="${escapeNotionHtml(todo.plannedEnd || "")}"
              data-todo-title="${escapeNotionHtml(todo.title)}">开始番茄</button>
          </div>
        </article>
      `;
    }).join("");
  }

  function renderWeeklyPlan(plan) {
    if (!plan) {
      activePhasePlan = null;
      elements.weeklyPlanView.innerHTML = `<div class="notion-empty">当前日期没有对应阶段计划。点击下方按钮，再在弹窗中设置日期和目标。</div>`;
      elements.openPhaseCreate.classList.remove("hidden");
      elements.openPhaseAdjust.classList.add("hidden");
      elements.summarizePhase.classList.add("hidden");
      elements.phasePlanPageId.value = "";
      elements.phasePlanPageId.dataset.planId = "";
      elements.phaseStart.value = elements.planDate.value || notionDateKey(new Date());
      elements.phaseEnd.value = addDays(elements.phaseStart.value, 6);
      elements.phaseEnd.min = elements.phaseStart.value;
      elements.phaseStart.disabled = false;
      elements.phaseDescription.value = "";
      elements.phaseConstraints.value = "";
      return;
    }
    activePhasePlan = plan;
    elements.openPhaseCreate.classList.add("hidden");
    elements.openPhaseAdjust.classList.remove("hidden");
    const canAdjust = plan.status !== "completed" && plan.endDate >= notionDateKey(new Date());
    elements.openPhaseAdjust.disabled = !canAdjust;
    elements.openPhaseAdjust.textContent = canAdjust ? "调整阶段计划" : "阶段计划已结束";
    elements.openPhaseAdjust.title = canAdjust ? "重排、延长或提前结束该计划" : "已结束的计划保留为历史记录";
    const selectedDate = elements.planDate.value || notionDateKey(new Date());
    const canSummarize = selectedDate === plan.endDate && notionDateKey(new Date()) >= plan.endDate && !plan.finalSummary;
    elements.summarizePhase.classList.toggle("hidden", !canSummarize);
    elements.summarizePhase.title = canSummarize ? "根据阶段内的待办、日报和真实时间记录生成总结" : "";
    elements.phasePlanPageId.value = plan.id || "";
    elements.phasePlanPageId.dataset.planId = plan.planId || "";
    elements.phaseStart.value = plan.startDate;
    elements.phaseEnd.value = plan.endDate;
    elements.phaseEnd.min = plan.startDate;
    elements.phaseStart.disabled = true;
    elements.phaseDescription.value = plan.description || "";
    elements.phaseConstraints.value = plan.constraints || "";
    const milestones = Array.isArray(plan.milestones) ? plan.milestones : [];
    const today = notionDateKey(new Date());
    const dayMilestone = milestones.find((item) => item.date === today);
    elements.weeklyPlanView.innerHTML = `
      <article class="notion-weekly-plan-card" data-notion-url="${escapeNotionHtml(plan.url || "")}">
        <div class="phase-plan-card-head">
          <div><strong>${escapeNotionHtml(plan.title || "阶段计划")}</strong><span>${escapeNotionHtml(plan.startDate)} → ${escapeNotionHtml(plan.endDate)}</span></div>
        </div>
        <div class="phase-plan-breakdown phase-plan-primary">
          <small>${escapeNotionHtml(today)} · 今日阶段计划</small>
          ${dayMilestone
            ? `<ol class="notion-milestones"><li>
                  <time>${escapeNotionHtml(dayMilestone.date)}</time>
                  <div class="phase-milestone-content">
                    <strong>${escapeNotionHtml(dayMilestone.goal || "未命名里程碑")}</strong>
                    ${renderMilestoneProgress(dayMilestone)}
                    ${Number(dayMilestone.estimatedMinutes) > 0 ? `<small>当日预计专注 ${escapeNotionHtml(dayMilestone.estimatedMinutes)} 分钟</small>` : ""}
                    ${Array.isArray(dayMilestone.taskEstimates) && dayMilestone.taskEstimates.length
                      ? `<ul>${dayMilestone.taskEstimates.map((task) => `<li><strong>${escapeNotionHtml(task.title)}</strong> · ${escapeNotionHtml(task.estimatedMinutes)} 分钟${task.deliverable ? ` · ${escapeNotionHtml(task.deliverable)}` : ""}</li>`).join("")}</ul>` : ""}
                    ${Array.isArray(dayMilestone.deliverables) && dayMilestone.deliverables.length
                      ? `<ul>${dayMilestone.deliverables.map((value) => `<li>${escapeNotionHtml(value)}</li>`).join("")}</ul>` : ""}
                    ${dayMilestone.notes ? `<p>${escapeNotionHtml(dayMilestone.notes)}</p>` : ""}
                  </div>
                </li></ol>`
            : '<div class="notion-empty">当天没有拆分后的阶段里程碑。</div>'}
        </div>
        <details class="phase-plan-source phase-plan-full-details">
          <summary>查看全部阶段计划</summary>
          ${milestones.length
            ? `<ol class="notion-milestones">${milestones.map((item) => `
                <li>
                  <time>${escapeNotionHtml(item.date)}</time>
                  <div class="phase-milestone-content">
                    <strong>${escapeNotionHtml(item.goal || "未命名里程碑")}</strong>
                    ${renderMilestoneProgress(item)}
                    ${Number(item.estimatedMinutes) > 0 ? `<small>当日预计专注 ${escapeNotionHtml(item.estimatedMinutes)} 分钟</small>` : ""}
                    ${Array.isArray(item.taskEstimates) && item.taskEstimates.length
                      ? `<ul>${item.taskEstimates.map((task) => `<li><strong>${escapeNotionHtml(task.title)}</strong> · ${escapeNotionHtml(task.estimatedMinutes)} 分钟${task.deliverable ? ` · ${escapeNotionHtml(task.deliverable)}` : ""}</li>`).join("")}</ul>` : ""}
                    ${Array.isArray(item.deliverables) && item.deliverables.length
                      ? `<ul>${item.deliverables.map((value) => `<li>${escapeNotionHtml(value)}</li>`).join("")}</ul>` : ""}
                    ${item.notes ? `<p>${escapeNotionHtml(item.notes)}</p>` : ""}
                  </div>
                </li>`).join("")}</ol>`
            : '<div class="notion-empty">尚未生成拆分结果。</div>'}
          <strong>原始描述与约束</strong>
          <p>${escapeNotionHtml(plan.description || "尚未填写计划描述")}</p>
          ${plan.constraints ? `<small>约束：${escapeNotionHtml(plan.constraints)}</small>` : ""}
          ${plan.adjustments?.length ? `<div class="phase-plan-breakdown"><small>调整记录</small><ol class="notion-milestones">${plan.adjustments.map((item) => `<li><time>${escapeNotionHtml(formatLocalDateTime(item.at))}</time><span>${escapeNotionHtml(item.summary || item.instruction || "已调整")}</span></li>`).join("")}</ol></div>` : ""}
          ${plan.finalSummary ? `<div class="phase-plan-breakdown"><small>阶段总结</small><p>${escapeNotionHtml(plan.finalSummary)}</p></div>` : ""}
        </details>
      </article>
    `;
  }

  async function handleTodoAction(event) {
    const editButton = event.target.closest(".notion-edit-todo");
    if (editButton) return openTodoEditor(currentTodos.find((todo) => todo.id === editButton.dataset.todoId));
    const doneButton = event.target.closest(".notion-done-todo");
    if (doneButton) return updateTodoStatus(doneButton.dataset.todoId, "done");
    const deleteButton = event.target.closest(".notion-delete-todo");
    if (deleteButton) return removeTodo(deleteButton.dataset.todoId);
    const button = event.target.closest(".notion-start-todo");
    if (!button) return;
    const todo = {
      id: button.dataset.todoId,
      url: button.dataset.todoUrl,
      date: button.dataset.todoDate,
      title: button.dataset.todoTitle,
      plannedStart: button.dataset.plannedStart,
      plannedEnd: button.dataset.plannedEnd,
    };
    return startTodo(todo);
  }

  async function startTodo(todo) {
    const controller = document.getElementById("pomodoroFrame")?.contentWindow?.MinimalPomodoroController;
    if (controller?.startTodoInPip) {
      try {
        // Invoke before the first await so Document PiP receives the original
        // button-click user activation required by Chrome.
        const startRequest = controller.startTodoInPip(todo);
        await chrome.storage.local.set({ minimalPomodoroSelectedTodo: todo });
        const started = await startRequest;
        setStatus("success", started
          ? `已在置顶小窗开始待办：${todo.title}`
          : `已在置顶小窗载入待办：${todo.title}`);
        return true;
      } catch (error) {
        await chrome.storage.local.set({ minimalPomodoroSelectedTodo: null });
        setStatus("error", friendlyError(error));
        return false;
      }
    }
    await chrome.storage.local.set({ minimalPomodoroSelectedTodo: todo });
    const response = await chrome.runtime.sendMessage({ type: "START_NOTION_TODO", payload: todo }).catch(() => null);
    if (!response?.ok || response.accepted === false) {
      await chrome.storage.local.set({ minimalPomodoroSelectedTodo: null });
      setStatus("error", response?.error || "无法打开番茄钟控制页，请重试。");
      return false;
    }
    if (response?.started) {
      setStatus("success", `已开始待办：${todo.title}`);
    } else {
      setStatus("success", `已载入待办：${todo.title}。请在番茄钟页面打开置顶小窗开始。`);
    }
    return true;
  }

  function openTodoEditor(todo = null) {
    elements.todoId.value = todo?.id || "";
    elements.todoTitle.value = todo?.title || "";
    elements.todoPriority.value = todo?.priority || "medium";
    elements.todoStart.value = timePart(todo?.plannedStart);
    elements.todoEnd.value = timePart(todo?.plannedEnd);
    elements.todoEstimate.value = todo?.estimatedPomodoros || "";
    elements.todoDetails.value = todo?.details || "";
    if (elements.todoEditorStart) {
      elements.todoEditorStart.classList.toggle("hidden", !todo);
      elements.todoEditorStart.dataset.todoId = todo?.id || "";
    }
    elements.todoEditor.dataset.notionUrl = todo?.url || "";
    document.getElementById("notionTodoEditorTitle").textContent = todo ? "编辑待办" : "新增待办";
    todoEditorOverlay?.classList.remove("hidden");
    document.body.classList.add("todo-editor-open");
    elements.todoEditor.classList.remove("hidden");
    elements.todoTitle.focus();
  }

  function closeTodoEditor() {
    todoEditorOverlay?.classList.add("hidden");
    document.body.classList.remove("todo-editor-open");
    elements.todoEditor.classList.add("hidden");
    elements.todoEditor.reset();
    elements.todoId.value = "";
    elements.todoEditorStart?.classList.add("hidden");
    if (elements.todoEditorStart) elements.todoEditorStart.dataset.todoId = "";
    delete elements.todoEditor.dataset.notionUrl;
  }

  async function startTodoFromEditor() {
    const todoId = elements.todoEditorStart?.dataset.todoId || elements.todoId.value;
    const todo = currentTodos.find((item) => item.id === todoId || item.externalId === todoId);
    if (!todo) {
      setStatus("error", "找不到当前待办，请关闭弹窗并刷新后重试。");
      return;
    }
    const accepted = await startTodo(todo);
    if (accepted) closeTodoEditor();
  }

  async function saveTodo(event) {
    event.preventDefault();
    await runOperation("正在保存到本地…", async () => {
      const config = await api.getConfig();
      const dateKey = elements.planDate.value || notionDateKey(new Date());
      const existing = currentTodos.find((todo) => todo.id === elements.todoId.value);
      const start = elements.todoStart.value;
      const end = elements.todoEnd.value;
      if ((start && !end) || (!start && end) || (start && end && start >= end)) {
        throw new Error("计划开始和结束时间需同时填写，且结束时间晚于开始时间。");
      }
      if (existing?.planningMode === "percentage" && Boolean(start && end) !== Boolean(elements.todoEstimate.value)) {
        throw new Error("比例目标排程时，请同时填写起止时间和番茄投入预算；都留空则保留为尚未排程目标。");
      }
      const cachedPhase = (await readPlanningCache(config)).phasesByDate[dateKey]?.value;
      const phasePlan = activePhasePlan?.startDate <= dateKey && activePhasePlan?.endDate >= dateKey
        ? activePhasePlan : cachedPhase;
      const localTodo = await api.queueDailyTodoUpsert(dateKey, {
        ...existing,
        id: elements.todoId.value || undefined,
        title: elements.todoTitle.value,
        priority: elements.todoPriority.value,
        details: elements.todoDetails.value,
        estimatedPomodoros: existing?.effortBasis === "unknown" && !elements.todoEstimate.value ? null : elements.todoEstimate.value,
        effortBasis: existing?.planningMode === "percentage" ? (start && end && elements.todoEstimate.value ? "time_budget" : "unknown") : existing?.effortBasis || "task_estimate",
        plannedStart: start ? `${dateKey}T${start}:00` : (existing?.planningMode === "percentage" ? null : ""),
        plannedEnd: end ? `${dateKey}T${end}:00` : (existing?.planningMode === "percentage" ? null : ""),
        origin: existing?.origin || "user",
        status: existing?.status || "pending",
        phasePlanId: existing?.phasePlanId || phasePlan?.planId || "",
        phasePlanName: existing?.phasePlanName || phasePlan?.title || "",
      });
      await upsertLocalTodoCache(dateKey, localTodo, config);
      closeTodoEditor();
      return `待办已保存到本地，将在下次定时同步写入 Notion。`;
    });
  }

  async function updateTodoStatus(pageId, status) {
    await runOperation("正在更新本地待办状态…", async () => {
      const config = await api.getConfig();
      const dateKey = elements.planDate.value || notionDateKey(new Date());
      const todo = currentTodos.find((item) => item.id === pageId || item.externalId === pageId);
      if (!todo) throw new Error("找不到待办，请刷新后重试。");
      const localTodo = await api.queueDailyTodoUpsert(dateKey, { ...todo, status });
      await upsertLocalTodoCache(dateKey, localTodo, config);
      return status === "done" ? "待办已在本地标记完成，等待同步。" : "待办状态已在本地更新，等待同步。";
    });
  }

  async function removeTodo(pageId) {
    if (!confirm("待办会先从本地移除，下次同步时再移入 Notion 回收站，确定继续吗？")) return;
    await runOperation("正在从本地删除待办…", async () => {
      const config = await api.getConfig();
      const dateKey = elements.planDate.value || notionDateKey(new Date());
      const todo = currentTodos.find((item) => item.id === pageId || item.externalId === pageId);
      if (!todo) throw new Error("找不到待办，请刷新后重试。");
      await api.queueDailyTodoDelete(dateKey, todo);
      await removeLocalTodoCache(dateKey, todo, config);
      closeTodoEditor();
      return "待办已从本地删除，等待同步到 Notion。";
    });
  }

  async function previewAdjustment() {
    if (adjustmentMode === "generate") return generateFlowTodos();
    const dateKey = elements.planDate.value || notionDateKey(new Date());
    const preparationMinutes = dateKey === notionDateKey(new Date()) && scheduleDelayToggle?.checked ? 10 : 0;
    closeAdjustmentEditor();
    const requestedAt = new Date().toISOString();
    await runOperation("正在让 LLM 调整待办…", async (progress) => {
      const config = await persistFormConfig();
      progress("sent", "正在先同步本地修改，确保调整基于最新待办…");
      await flushPendingWrites(config);
      progress("generating", preparationMinutes
        ? "LLM 正在理解调整方向并重排待办；今天的新任务将从现在 10 分钟后开始安排…"
        : "LLM 正在理解调整方向并重排待办；今天的新任务允许从当前时间开始安排…");
      pendingAdjustment = await api.previewTodoAdjustment(
        dateKey,
        elements.todoAdjustment.value,
        config,
        { requestedAt, preparationMinutes }
      );
      const todos = Array.isArray(pendingAdjustment.todos) ? pendingAdjustment.todos : [];
      const deletionCount = (pendingAdjustment.deletedTodoIds || []).length;
      llmProgressResult.innerHTML = `
        <strong>${escapeNotionHtml(pendingAdjustment.changeSummary || "调整预览")}</strong>
        ${pendingAdjustment.earliestStart ? `<small>本次新排程最早从 ${escapeNotionHtml(pendingAdjustment.earliestStart.slice(11, 16))} 开始</small>` : ""}
        <ul>${todos.map((todo) => `<li>${escapeNotionHtml(formatTodoSchedule(todo))} · ${escapeNotionHtml(todo.title)}</li>`).join("")}</ul>
        ${deletionCount ? `<small>明确删除：${(pendingAdjustment.deletedTodos || []).map((todo) => escapeNotionHtml(todo.title)).join("、") || `${deletionCount} 条尚未开始的 LLM 待办`}</small>` : ""}
        ${(pendingAdjustment.warnings || []).length ? `<small>${pendingAdjustment.warnings.map(escapeNotionHtml).join("；")}</small>` : ""}
        <button class="primary" id="notionApplyAdjustment" type="button">应用这版待办</button>`;
      llmProgressResult.classList.remove("hidden");
      return `已生成 ${todos.length} 条调整预览，确认后才会写入 Notion。`;
    }, { trigger: elements.previewAdjustment, estimate: "通常需要 15–45 秒", llm: true, keepOpen: true });
  }

  function openScheduleDialog(mode, dateKey) {
    adjustmentMode = mode;
    elements.planDate.value = dateKey;
    const isGenerate = mode === "generate";
    const isToday = dateKey === notionDateKey(new Date());
    const dialog = adjustmentOverlay?.querySelector(".notion-adjust-dialog");
    dialog?.classList.toggle("generation-mode", isGenerate);
    if (adjustmentDialogTitle) adjustmentDialogTitle.textContent = isGenerate ? "让 LLM 生成当天待办" : "让 LLM 调整当天待办";
    if (adjustmentDialogDescription) {
      adjustmentDialogDescription.textContent = isGenerate
        ? "根据阶段计划、前一天执行情况和个人节奏生成当天安排。"
        : "用自然语言描述需要调整的方向，预览后再应用。";
    }
    if (elements.previewAdjustment) {
      elements.previewAdjustment.textContent = isGenerate ? "开始生成待办" : "预览调整";
      elements.previewAdjustment.classList.toggle("primary", isGenerate);
      elements.previewAdjustment.classList.toggle("ghost", !isGenerate);
    }
    if (scheduleDelayToggle) {
      scheduleDelayToggle.checked = true;
      scheduleDelayToggle.disabled = !isToday;
      scheduleDelayToggle.closest(".schedule-delay-option")?.classList.toggle("is-disabled", !isToday);
    }
    adjustmentOverlay?.classList.remove("hidden");
    document.body.classList.add("todo-editor-open");
    if (!isGenerate) elements.todoAdjustment.focus();
    else elements.previewAdjustment?.focus();
  }

  async function generateFlowTodos() {
    const dateKey = elements.planDate.value || notionDateKey(new Date());
    const preparationMinutes = dateKey === notionDateKey(new Date()) && scheduleDelayToggle?.checked ? 10 : 0;
    const requestedAt = new Date().toISOString();
    closeAdjustmentEditor();
    return runOperation("正在生成当天待办…", async (progress) => {
      const config = await api.getConfig();
      progress("sent", "正在先同步本地修改，确保 LLM 使用最新数据…");
      await flushPendingWrites(config);
      progress("generating", preparationMinutes
        ? "LLM 正在根据阶段计划和实际进度排程；今天将从现在 10 分钟后开始安排…"
        : "LLM 正在根据阶段计划和实际进度排程；今天允许从当前时间开始安排…");
      const result = await api.generateDayTodos(dateKey, config, { requestedAt, preparationMinutes });
      progress("writing", "待办已生成，正在确认 Notion 数据并刷新卡片…");
      await loadFlowDay(dateKey, config);
      const boundary = result.earliestStart ? `，排程从 ${result.earliestStart.slice(11, 16)} 开始` : "";
      return `已为 ${dateKey} 生成 ${result.todoSummary.total} 条待办${boundary}${result.usedPreviousContext ? "，并参考了前一日内容" : "，本次主要依据阶段计划"}。`;
    }, { trigger: elements.previewAdjustment, estimate: "通常需要 15–45 秒", llm: true });
  }

  async function applyAdjustment(event) {
    if (!event.target.closest("#notionApplyAdjustment") || !pendingAdjustment) return;
    await runOperation("正在应用调整…", async (progress) => {
      const config = await persistFormConfig();
      const dateKey = elements.planDate.value || notionDateKey(new Date());
      progress("writing", "正在把调整后的待办写入 Notion…");
      const result = await api.applyTodoAdjustment(
        dateKey,
        pendingAdjustment.todos,
        elements.todoAdjustment.value,
        config,
        {
          deletedTodoIds: pendingAdjustment.deletedTodoIds || [],
          baseVersions: pendingAdjustment.baseVersions || {},
        }
      );
      pendingAdjustment = null;
      await loadPlanningContext({ silent: true });
      if (flowCard(dateKey)) await loadFlowDay(dateKey, config);
      closeAdjustmentEditor();
      return `调整已写入 Notion：新建 ${result.created}，更新 ${result.updated}，删除 ${result.deleted || 0}。`;
    }, { llm: true, initialStep: "writing" });
  }

  function closeAdjustmentEditor() {
    adjustmentOverlay?.classList.add("hidden");
    document.body.classList.remove("todo-editor-open");
  }

  function openPhaseCreateEditor(preferredStartDate) {
    const startDate = preferredStartDate || elements.planDate.value || notionDateKey(new Date());
    elements.phasePlanPageId.value = "";
    elements.phasePlanPageId.dataset.planId = "";
    elements.phaseStart.disabled = false;
    elements.phaseStart.value = startDate;
    elements.phaseEnd.min = startDate;
    elements.phaseEnd.value = addDays(startDate, 6);
    elements.phaseDescription.value = "";
    elements.phaseConstraints.value = "";
    elements.phasePlanForm.classList.remove("hidden");
    phaseMetadataForm?.classList.add("hidden");
    elements.phaseAdjustBox.classList.add("hidden");
    phaseSummaryChoice.classList.add("hidden");
    phaseEditorTitle.textContent = "生成阶段计划";
    phaseEditorDescription.textContent = "选择开始与结束日期，再用自然语言说明目标和约束，LLM 会生成阶段名称并拆分每日里程碑。";
    phaseEditorOverlay.classList.remove("hidden");
    document.body.classList.add("todo-editor-open");
    window.setTimeout(() => elements.phaseStart.focus(), 0);
  }

  function openPhaseAdjustEditor() {
    if (!activePhasePlan) {
      setStatus("error", "当前日期没有可调整的阶段计划。");
      return;
    }
    elements.phasePlanForm.classList.add("hidden");
    phaseMetadataForm?.classList.add("hidden");
    elements.phaseAdjustBox.classList.remove("hidden");
    phaseSummaryChoice.classList.add("hidden");
    elements.phaseCurrentRange.textContent = `当前计划：${activePhasePlan.startDate} → ${activePhasePlan.endDate}`;
    const replan = elements.phaseAdjustBox.querySelector('input[name="notionPhaseAdjustMode"][value="replan"]');
    if (replan) replan.checked = true;
    const shorten = elements.phaseAdjustBox.querySelector('input[name="notionPhaseAdjustMode"][value="shorten"]');
    if (shorten) shorten.disabled = addDays(activePhasePlan.endDate, -1) < activePhasePlan.startDate;
    elements.phaseAdjustment.value = "";
    elements.phaseAdjustedEnd.value = activePhasePlan.endDate;
    updatePhaseAdjustMode("replan");
    phaseEditorTitle.textContent = "调整阶段计划";
    phaseEditorDescription.textContent = "选择调整方式，说明变化原因和期望。已过去的里程碑与原计划 ID 会保留。";
    phaseEditorOverlay.classList.remove("hidden");
    document.body.classList.add("todo-editor-open");
    window.setTimeout(() => elements.phaseAdjustment.focus(), 0);
  }

  function handlePhaseAdjustModeChange(event) {
    if (event.target?.name !== "notionPhaseAdjustMode") return;
    updatePhaseAdjustMode(event.target.value);
  }

  function updatePhaseAdjustMode(mode) {
    if (!activePhasePlan) return;
    const usesEndDate = mode === "extend" || mode === "shorten";
    elements.adjustPhase.textContent = mode === "shorten" ? "提前结束阶段计划" : "让 LLM 调整剩余计划";
    elements.adjustPhase.classList.toggle("danger", mode === "shorten");
    elements.phaseAdjustedEndField.classList.toggle("hidden", !usesEndDate);
    elements.phaseAdjustedEnd.required = usesEndDate;
    elements.phaseAdjustedEnd.removeAttribute("min");
    elements.phaseAdjustedEnd.removeAttribute("max");
    if (mode === "extend") {
      elements.phaseAdjustedEndLabel.textContent = "延长到";
      elements.phaseAdjustedEnd.min = addDays(activePhasePlan.endDate, 1);
      elements.phaseAdjustedEnd.value = addDays(activePhasePlan.endDate, 1);
      elements.phaseAdjustment.placeholder = "说明为什么需要延长，以及希望如何重排新增时间中的任务。";
    } else if (mode === "shorten") {
      const today = notionDateKey(new Date());
      const minimum = activePhasePlan.startDate;
      const maximum = addDays(activePhasePlan.endDate, -1);
      const yesterday = addDays(today, -1);
      elements.phaseAdjustedEndLabel.textContent = "提前结束于";
      elements.phaseAdjustedEnd.min = minimum;
      elements.phaseAdjustedEnd.max = maximum;
      elements.phaseAdjustedEnd.value = yesterday >= minimum && yesterday <= maximum ? yesterday : maximum;
      elements.phaseAdjustment.placeholder = "可选：说明是提前完成、缩小范围还是无法继续。提前结束不会调用 LLM。";
    } else {
      elements.phaseAdjustedEnd.value = activePhasePlan.endDate;
      elements.phaseAdjustment.placeholder = "说明实际变化、当前困难和希望如何调整剩余计划。";
    }
  }

  function closePhaseEditor() {
    phaseEditorOverlay?.classList.add("hidden");
    pendingPhaseSummaryPlan = null;
    editingPhasePlan = null;
    phaseMetadataForm?.classList.add("hidden");
    document.body.classList.remove("todo-editor-open");
  }

  function showPhaseSummaryChoice(plan) {
    pendingPhaseSummaryPlan = plan;
    elements.phasePlanForm.classList.add("hidden");
    phaseMetadataForm?.classList.add("hidden");
    elements.phaseAdjustBox.classList.add("hidden");
    phaseSummaryChoice.classList.remove("hidden");
    const message = phaseSummaryChoice.querySelector("[data-phase-summary-choice-text]");
    if (message) message.textContent = `“${plan.title || "阶段计划"}”已结束于 ${plan.endDate}。是否现在根据阶段内的待办完成情况、每日时间投入和日报生成总结？`;
    phaseEditorTitle.textContent = "是否生成阶段总结？";
    phaseEditorDescription.textContent = "阶段计划已提前结束，本次结束没有调用 LLM。";
    phaseEditorOverlay.classList.remove("hidden");
    document.body.classList.add("todo-editor-open");
  }

  function readPhasePlan() {
    return {
      id: elements.phasePlanPageId.value || undefined,
      planId: elements.phasePlanPageId.dataset.planId || undefined,
      startDate: elements.phaseStart.value,
      endDate: elements.phaseEnd.value,
      description: elements.phaseDescription.value,
      constraints: elements.phaseConstraints.value,
      status: "active",
    };
  }

  async function decomposePhasePlan(event) {
    event.preventDefault();
    await runOperation("正在拆分阶段计划…", async (progress) => {
      const config = await persistFormConfig();
      progress("generating", "LLM 正在分析目标并拆分每日里程碑…");
      const result = await api.decomposePhasePlan(readPhasePlan(), config);
      let initialTodoCount = null;
      let initialTodoError = "";
      if (result.plan.startDate === notionDateKey(new Date())) {
        progress("generating", "阶段计划已生成，LLM 正在安排首日待办…");
        try {
          const initial = await api.generateInitialDayTodos(result.plan.startDate, config, {
            requestedAt: new Date().toISOString(),
            preparationMinutes: 10,
          });
          initialTodoCount = initial.todoSummary?.total || 0;
        } catch (error) {
          initialTodoError = friendlyError(error);
        }
      }
      progress("writing", "计划已生成，正在写入 Notion 并刷新…");
      elements.phasePlanPageId.value = result.plan.id;
      elements.phasePlanPageId.dataset.planId = result.plan.planId;
      elements.planDate.value = result.plan.startDate;
      await clearPhasePlanningCache(config);
      await loadPlanningContext({ silent: true });
      closePhaseEditor();
      await refreshPhasePlanSurfaces(config);
      return `阶段计划已拆分为 ${result.milestones?.length || 0} 个每日里程碑${initialTodoCount == null ? "" : `；首日已生成 ${initialTodoCount} 条待办`}${initialTodoError ? `；首日待办暂未生成：${initialTodoError}` : ""}。`;
    }, { trigger: event.submitter, estimate: "通常需要 20–60 秒", llm: true });
  }

  async function adjustPhasePlan() {
    const selectedMode = elements.phaseAdjustBox.querySelector('input[name="notionPhaseAdjustMode"]:checked')?.value || "replan";
    if (selectedMode === "shorten") return endPhasePlanFromEditor();
    await runOperation("正在根据实际进度调整剩余阶段计划…", async (progress) => {
      const config = await persistFormConfig();
      await flushPendingWrites(config);
      const current = await api.loadPhasePlan(elements.planDate.value || notionDateKey(new Date()), config);
      if (!current) throw new Error("当前日期没有可调整的阶段计划。");
      const mode = elements.phaseAdjustBox.querySelector('input[name="notionPhaseAdjustMode"]:checked')?.value || "replan";
      const requestedEndDate = mode === "replan" ? current.endDate : elements.phaseAdjustedEnd.value;
      if (!requestedEndDate || requestedEndDate < current.startDate) throw new Error("阶段计划的结束日期不能早于开始日期。");
      const today = notionDateKey(new Date());
      if (requestedEndDate < today) throw new Error("延长或重排后的结束日期不能早于今天。");
      if (mode === "extend" && requestedEndDate <= current.endDate) throw new Error("延长后的结束日期必须晚于当前结束日期。");
      if (mode === "shorten" && requestedEndDate >= current.endDate) throw new Error("提前结束日期必须早于当前结束日期。");
      const rawInstruction = elements.phaseAdjustment.value.trim();
      const modeLabel = ({ replan: "调整计划", extend: "延长时间", shorten: "提前结束" })[mode];
      const instruction = rawInstruction
        ? `调整类型：${modeLabel}。${mode === "replan" ? "" : `新的结束日期：${requestedEndDate}。`}用户说明：${rawInstruction}`
        : `调整类型：${modeLabel}。${mode === "replan" ? "" : `新的结束日期：${requestedEndDate}。`}用户未填写额外说明，请根据真实进度和剩余容量合理调整。`;
      progress("generating", "LLM 正在对照实际进度重排剩余里程碑…");
      const result = await api.adjustPhasePlan({ ...current, endDate: requestedEndDate, previousEndDate: current.endDate }, instruction, config);
      progress("writing", "调整已生成，正在确认 Notion 数据…");
      elements.phaseAdjustment.value = "";
      renderWeeklyPlan(result.plan);
      await clearPhasePlanningCache(config);
      const keys = currentWeekDateKeys();
      if (!document.getElementById("todayView")?.classList.contains("hidden")) {
        const today = notionDateKey(new Date());
        await Promise.all([loadWeekFlow([today]), loadGridTodos([today], config)]);
      } else if (!document.getElementById("textView")?.classList.contains("hidden")) {
        await loadWeekFlow(keys);
      } else if (!document.getElementById("gridView")?.classList.contains("hidden")) {
        await loadGridTodos(keys, config);
      }
      elements.phaseSummary.classList.remove("hidden");
      elements.phaseSummary.dataset.state = "success";
      elements.phaseSummary.textContent = result.changeSummary || "阶段计划剩余里程碑已调整。";
      closePhaseEditor();
      await refreshPhasePlanSurfaces(config);
      return `阶段计划已调整；保留名称“${result.plan.title}”和原计划 ID，以维持历史关联。`;
    }, { trigger: elements.adjustPhase, estimate: "通常需要 20–60 秒", llm: true });
  }

  async function endPhasePlanFromEditor() {
    await runOperation("正在提前结束阶段计划…", async () => {
      const config = await persistFormConfig();
      await flushPendingWrites(config);
      const current = await api.loadPhasePlan(elements.planDate.value || notionDateKey(new Date()), config);
      if (!current) throw new Error("当前日期没有可结束的阶段计划。");
      const requestedEndDate = elements.phaseAdjustedEnd.value;
      const result = await api.endPhasePlanEarly(current, requestedEndDate, elements.phaseAdjustment.value, config);
      await clearPhasePlanningCache(config);
      const keys = currentWeekDateKeys();
      if (!document.getElementById("todayView")?.classList.contains("hidden")) {
        const today = notionDateKey(new Date());
        await Promise.all([loadWeekFlow([today]), loadGridTodos([today], config)]);
      } else if (!document.getElementById("textView")?.classList.contains("hidden")) {
        await loadWeekFlow(keys);
      } else if (!document.getElementById("gridView")?.classList.contains("hidden")) {
        await loadGridTodos(keys, config);
      }
      showPhaseSummaryChoice(result.plan);
      await refreshPhasePlanSurfaces(config);
      return `阶段计划已直接提前结束于 ${result.plan.endDate}，未调用 LLM。`;
    }, { trigger: elements.adjustPhase });
  }

  async function generatePhaseSummary(planInput, trigger) {
    const plan = planInput;
    if (!plan?.id) {
      setStatus("error", "没有可生成总结的阶段计划。");
      return;
    }
    await runOperation("正在生成阶段计划总结…", async (progress) => {
      const config = await persistFormConfig();
      progress("generating", "LLM 正在综合每日待办状态、完成情况与真实时间投入…");
      const result = await api.summarizePhasePlan(plan, config);
      await clearPhasePlanningCache(config);
      progress("writing", "总结已生成，正在确认 Notion 写入并刷新页面…");
      const keys = currentWeekDateKeys();
      if (!document.getElementById("todayView")?.classList.contains("hidden")) {
        const today = notionDateKey(new Date());
        await Promise.all([loadWeekFlow([today]), loadGridTodos([today], config)]);
      } else if (!document.getElementById("textView")?.classList.contains("hidden")) {
        await loadWeekFlow(keys);
      } else if (!document.getElementById("gridView")?.classList.contains("hidden")) {
        await loadGridTodos(keys, config);
      }
      closePhaseEditor();
      await refreshPhasePlanSurfaces(config);
      return result.skipped
        ? "该阶段计划已有总结，本次未重复生成。"
        : `“${result.plan.title}”的阶段总结已写入 Notion。`;
    }, { trigger, estimate: "通常需要 20–60 秒", llm: true });
  }

  async function loadProfile(config, silent = false) {
    try {
      const profile = await api.loadPlanningProfile(config);
      elements.profileTimezone.value = profile.timezone || "Asia/Chongqing";
      elements.workWindows.value = formatRecurringBlocks(profile.workWindows);
      elements.routineBlocks.value = formatRecurringBlocks(profile.routineBlocks);
      elements.dateOverrides.value = formatDateBlocks(profile.dateOverrides);
      elements.profileWorkMinutes.value = profile.pomodoroSettings?.workMinutes || 25;
      elements.profileBreakMinutes.value = profile.pomodoroSettings?.breakMinutes || 5;
      elements.preferenceNote.value = profile.preferenceNote || "";
      elements.profileForm.dataset.notionUrl = profile.url || "";
      globalThis.PersonalSystemWorkspace?.refreshScheduleEditors();
    } catch (error) {
      if (!silent) throw error;
      console.warn("Unable to load planning profile", error);
    }
  }

  async function saveProfile(event) {
    event.preventDefault();
    await runOperation("正在保存个人节奏到本地…", async () => {
      await persistFormConfig();
      const profileInput = {
        timezone: elements.profileTimezone.value,
        pomodoroSettings: { workMinutes: elements.profileWorkMinutes.value, breakMinutes: elements.profileBreakMinutes.value },
        workWindows: parseRecurringBlocks(elements.workWindows.value, "work", "工作窗口"),
        routineBlocks: parseRecurringBlocks(elements.routineBlocks.value, "unavailable", "固定/不可用安排"),
        dateOverrides: parseDateBlocks(elements.dateOverrides.value),
        preferenceNote: elements.preferenceNote.value,
      };
      assertProfileTimezoneMatchesDevice(profileInput.timezone);
      const saved = await api.queuePlanningProfile(profileInput);
      elements.profileTimezone.value = saved.timezone;
      elements.workWindows.value = formatRecurringBlocks(saved.workWindows);
      elements.routineBlocks.value = formatRecurringBlocks(saved.routineBlocks);
      elements.dateOverrides.value = formatDateBlocks(saved.dateOverrides);
      elements.profileWorkMinutes.value = saved.pomodoroSettings?.workMinutes || 25;
      elements.profileBreakMinutes.value = saved.pomodoroSettings?.breakMinutes || 5;
      elements.preferenceNote.value = saved.preferenceNote || "";
      globalThis.PersonalSystemWorkspace?.refreshScheduleEditors();
      return "个人节奏已保存到本地，后续 LLM 会立即使用，Notion 将在下次同步更新。";
    });
  }

  async function saveCompletion() {
    await runOperation("正在保存当天完成情况到本地…", async () => {
      await persistFormConfig();
      const dateKey = elements.planDate.value || notionDateKey(new Date());
      await api.queueDailyCompletion(dateKey, elements.dailyCompletion.value);
      return `${dateKey} 完成情况已保存到本地，等待同步。`;
    });
  }

  async function triggerReview() {
    await runOperation("正在生成总结和次日待办…", async (progress) => {
      const config = await persistFormConfig();
      const dateKey = elements.planDate.value || notionDateKey(new Date());
      progress("sent", "正在先同步本地修改，确保 LLM 使用最新数据…");
      await flushPendingWrites(config);
      const phasePlan = await api.loadPhasePlan(dateKey, config);
      const completion = elements.dailyCompletion.value.trim();
      if (!completion && phasePlan?.startDate === dateKey) {
        progress("generating", "LLM 正在生成阶段计划首日待办…");
        const firstDay = await api.generateInitialDayTodos(dateKey, config, {
          requestedAt: new Date().toISOString(), preparationMinutes: 10,
        });
        progress("writing", "正在确认 Notion 写入并刷新…");
        await loadPlanningContext({ silent: true });
        return `${dateKey} 是阶段计划第一天，已直接生成 ${firstDay.todoSummary.total} 条当天待办。`;
      }
      await api.saveDailyCompletion(dateKey, completion, config);
      progress("generating", "LLM 正在生成总结和次日待办…");
      const result = await api.triggerDailyReview(dateKey, config);
      progress("writing", "生成完成，正在确认 Notion 写入并刷新…");
      if (!result.nextTodoSkipped) elements.planDate.value = result.nextTodoDate;
      await loadPlanningContext({ silent: true });
      if (result.wroteToNotion) {
        const archiveMessage = result.archive
          ? "；每日归档已生成"
          : result.archiveError ? `；每日归档失败：${result.archiveError}` : "";
        return result.nextTodoSkipped
          ? `${dateKey} 总结已写入${archiveMessage}；${result.nextTodoBlockedReason}，未生成次日待办。`
          : `${dateKey} 总结已写入；${result.nextTodoDate} 待办已生成 ${result.todoSummary.total} 条（新建 ${result.todoSummary.created}，更新 ${result.todoSummary.updated}）${archiveMessage}。`;
      }
      return `${dateKey} LLM 已执行，但未返回可写入的总结。`;
    }, { trigger: elements.triggerReview, estimate: "通常需要 20–60 秒", llm: true });
  }

  async function runOperation(message, operation, options = {}) {
    const isLlm = Boolean(options.llm || options.estimate);
    if (isLlm && llmProgressBusy) return;
    const startedAt = Date.now();
    let activeStep = options.initialStep || "sent";
    const progress = (step, detail) => {
      activeStep = step;
      if (isLlm) setLlmProgressStep(step, detail);
    };
    if (isLlm) openLlmProgress(message, options.estimate, activeStep);
    if (options.trigger) {
      options.trigger.classList.add("is-busy");
      options.trigger.setAttribute("aria-busy", "true");
    }
    const updateWaitingState = () => {
      const seconds = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
      const waitingMessage = `${message} ${options.estimate || ""} · 已等待 ${seconds} 秒`.replace(/\s+/g, " ").trim();
      setStatus("working", waitingMessage);
      setConnectionState("working", `处理中 · ${seconds} 秒`);
      if (isLlm && llmProgressElapsed) llmProgressElapsed.textContent = `${seconds} 秒`;
      if (isLlm) updateLlmTaskChip("working", llmProgressTitle?.textContent || message.replace(/…$/, ""), `${seconds} 秒`);
    };
    updateWaitingState();
    const waitingTimer = isLlm ? window.setInterval(updateWaitingState, 1000) : null;
    setButtonsDisabled(true);
    const generatingTimer = isLlm && activeStep === "sent"
      ? window.setTimeout(() => {
        if (activeStep === "sent") progress("generating", "LLM 已接收请求，正在生成内容…");
      }, 450)
      : null;
    try {
      const resultMessage = await operation(progress);
      if (generatingTimer) window.clearTimeout(generatingTimer);
      if (isLlm) {
        setLlmProgressStep("done", resultMessage || "操作已完成。");
        llmProgressBusy = false;
        llmProgressClose.disabled = false;
        llmProgressClose.textContent = "关闭";
      }
      setStatus("success", resultMessage || "操作完成。");
      if (elements.connectionState.dataset.state === "working") {
        setConnectionState("success", "操作完成");
      }
    } catch (error) {
      console.warn("Notion integration error", error);
      const errorMessage = friendlyError(error);
      if (isLlm) {
        setLlmProgressError(errorMessage);
        llmProgressBusy = false;
        llmProgressClose.disabled = false;
        llmProgressClose.textContent = "关闭";
      }
      setStatus("error", errorMessage);
      setConnectionState("error", "操作失败");
    } finally {
      if (generatingTimer) window.clearTimeout(generatingTimer);
      if (waitingTimer) window.clearInterval(waitingTimer);
      if (options.trigger) {
        options.trigger.classList.remove("is-busy");
        options.trigger.removeAttribute("aria-busy");
      }
      setButtonsDisabled(false);
      if (isLlm && !options.keepOpen && !llmProgressBusy && llmProgressOverlay?.dataset.state === "success") {
        if (llmProgressOverlay.classList.contains("hidden")) window.setTimeout(hideLlmTaskChip, 5000);
        else window.setTimeout(closeLlmProgress, 1800);
      }
    }
  }

  function openLlmProgress(title, estimate, initialStep = "sent") {
    llmProgressBusy = true;
    llmProgressOverlay.dataset.state = "working";
    llmProgressOverlay.classList.remove("hidden");
    llmProgressTitle.textContent = title.replace(/…$/, "");
    llmProgressElapsed.textContent = "0 秒";
    llmProgressStatus.textContent = `请求已发送${estimate ? ` · ${estimate}` : ""}`;
    llmProgressClose.disabled = false;
    llmProgressClose.textContent = "转到后台";
    llmProgressResult.classList.add("hidden");
    llmProgressResult.innerHTML = "";
    for (const item of llmProgressOverlay.querySelectorAll("[data-llm-step]")) item.dataset.state = "pending";
    setLlmProgressStep(initialStep, initialStep === "writing" ? "正在写入 Notion…" : llmProgressStatus.textContent);
    updateLlmTaskChip("working", llmProgressTitle.textContent, "0 秒");
    document.body.classList.add("llm-progress-open");
  }

  function setLlmProgressStep(step, detail) {
    const order = ["sent", "generating", "writing", "done"];
    const index = order.indexOf(step);
    for (const item of llmProgressOverlay.querySelectorAll("[data-llm-step]")) {
      const itemIndex = order.indexOf(item.dataset.llmStep);
      item.dataset.state = itemIndex < index ? "complete" : itemIndex === index ? "active" : "pending";
    }
    if (detail) llmProgressStatus.textContent = detail;
    updateLlmTaskChip(step === "done" ? "success" : "working", detail || llmProgressTitle.textContent, llmProgressElapsed?.textContent || "");
    if (step === "done") {
      llmProgressOverlay.dataset.state = "success";
      const done = llmProgressOverlay.querySelector('[data-llm-step="done"]');
      if (done) done.dataset.state = "complete";
    }
  }

  function setLlmProgressError(message) {
    llmProgressOverlay.dataset.state = "error";
    llmProgressStatus.textContent = message;
    updateLlmTaskChip("error", "LLM 操作失败", llmProgressElapsed?.textContent || "");
  }

  function closeLlmProgress() {
    if (llmProgressBusy) return;
    clearExternalLlmTimer();
    llmProgressOverlay?.classList.add("hidden");
    hideLlmTaskChip();
    document.body.classList.remove("llm-progress-open");
  }

  function minimizeLlmProgress() {
    llmProgressOverlay?.classList.add("hidden");
    document.body.classList.remove("llm-progress-open");
    updateLlmTaskChip("working", llmProgressStatus?.textContent || "LLM 正在处理", llmProgressElapsed?.textContent || "");
  }

  function clearExternalLlmTimer() {
    if (llmExternalElapsedTimer) window.clearInterval(llmExternalElapsedTimer);
    llmExternalElapsedTimer = null;
    llmExternalStartedAt = 0;
    llmExternalHeartbeatAt = 0;
    llmExternalPhase = "";
  }

  function externalPhaseTimeout(phase) {
    return ({
      sent: 120000,
      reading: 120000,
      generating: 90000,
      repairing: 90000,
      validating: 60000,
      writing: 180000,
    })[phase] || 120000;
  }

  function startExternalLlmTimer(startedAt, heartbeatAt, phase) {
    if (!Number.isFinite(startedAt)) return;
    if (llmExternalElapsedTimer && llmExternalStartedAt === startedAt) {
      if (Number.isFinite(heartbeatAt)) llmExternalHeartbeatAt = heartbeatAt;
      if (phase) llmExternalPhase = phase;
      return;
    }
    clearExternalLlmTimer();
    llmExternalStartedAt = startedAt;
    llmExternalHeartbeatAt = Number.isFinite(heartbeatAt) ? heartbeatAt : startedAt;
    llmExternalPhase = phase || "sent";
    const tick = () => {
      const seconds = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
      const elapsed = `${seconds} 秒`;
      if (llmProgressElapsed) llmProgressElapsed.textContent = elapsed;
      updateLlmTaskChip("working", llmProgressTitle?.textContent || "正在调整今日剩余待办", elapsed);
      const heartbeatExpired = Date.now() - llmExternalHeartbeatAt >= externalPhaseTimeout(llmExternalPhase);
      const overallExpired = Date.now() - startedAt >= 15 * 60 * 1000;
      if (heartbeatExpired || overallExpired) reconcileStaleExternalLlmTask(startedAt);
    };
    tick();
    if (llmExternalStartedAt) llmExternalElapsedTimer = window.setInterval(tick, 1000);
  }

  async function reconcileStaleExternalLlmTask(startedAt) {
    if (llmExternalStartedAt !== startedAt) return;
    clearExternalLlmTimer();
    const stored = await chrome.storage.local.get("minimalPomodoroNotionAutomationState");
    const latest = stored.minimalPomodoroNotionAutomationState;
    if (latest?.type === "intraday_adjustment" && ["done", "skipped", "error"].includes(latest.phase)) {
      applyAutomationState(latest);
      return;
    }
    const latestHeartbeat = Date.parse(latest?.at || "");
    const latestStartedAt = Date.parse(latest?.startedAt || "");
    const latestPhase = latest?.phase || llmExternalPhase || "sent";
    const stillWorking = ["sent", "reading", "generating", "repairing", "validating", "writing"].includes(latestPhase);
    const heartbeatFresh = Number.isFinite(latestHeartbeat) && Date.now() - latestHeartbeat < externalPhaseTimeout(latestPhase);
    const withinOverallLimit = !Number.isFinite(latestStartedAt) || Date.now() - latestStartedAt < 15 * 60 * 1000;
    if (stillWorking && heartbeatFresh && withinOverallLimit) {
      startExternalLlmTimer(
        Number.isFinite(latestStartedAt) ? latestStartedAt : startedAt,
        latestHeartbeat,
        latestPhase
      );
      return;
    }
    const phaseLabel = ({ sent: "请求准备", reading: "Notion 数据读取", generating: "LLM 首次生成", repairing: "LLM 自动修正", validating: "结果校验", writing: "Notion 写入" })[latestPhase] || "后台处理";
    const message = `${phaseLabel}阶段长时间没有新心跳，后台任务可能已中断。页面已自动刷新；如果待办已变化，说明 Notion 写入已完成但最终状态丢失。`;
    await chrome.storage.local.set({
      minimalPomodoroNotionAutomationState: {
        ...(latest || {}),
        type: "intraday_adjustment",
        phase: "error",
        at: new Date().toISOString(),
        message,
      },
    });
    if (llmProgressOverlay) {
      setLlmProgressError(message);
      llmProgressBusy = false;
      llmProgressClose.disabled = false;
      llmProgressClose.textContent = "关闭";
    }
    setStatus("error", message);
    setConnectionState("error", "后台状态超时");
    const keys = currentWeekDateKeys();
    if (!document.getElementById("todayView")?.classList.contains("hidden")) {
      const today = notionDateKey(new Date());
      Promise.all([loadWeekFlow([today]), loadGridTodos([today])])
        .catch((error) => console.warn("Unable to refresh today after stale LLM task", error));
    } else if (!document.getElementById("textView")?.classList.contains("hidden")) {
      loadWeekFlow(keys).catch((error) => console.warn("Unable to refresh after stale LLM task", error));
    } else if (!document.getElementById("gridView")?.classList.contains("hidden")) {
      loadGridTodos(keys)
        .catch((error) => console.warn("Unable to refresh after stale LLM task", error));
    }
  }

  function restoreLlmProgress() {
    if (!llmProgressOverlay) return;
    llmProgressOverlay.classList.remove("hidden");
    document.body.classList.add("llm-progress-open");
    if (llmProgressClose) llmProgressClose.textContent = llmProgressBusy ? "转到后台" : "关闭";
  }

  function updateLlmTaskChip(state, message, elapsed) {
    if (!elements.llmTaskChip) return;
    elements.llmTaskChip.dataset.state = state;
    elements.llmTaskChip.classList.remove("hidden");
    if (elements.llmTaskChipText) elements.llmTaskChipText.textContent = message || "LLM 正在处理";
    if (elements.llmTaskChipElapsed) elements.llmTaskChipElapsed.textContent = elapsed || "";
  }

  function hideLlmTaskChip() {
    elements.llmTaskChip?.classList.add("hidden");
  }

  function setButtonsDisabled(disabled) {
    const buttons = [
      elements.testConnection,
      elements.initializeWorkspace,
      elements.syncWeek,
      elements.syncAll,
      elements.loadPlan,
      elements.triggerReview,
      elements.saveCompletion,
      elements.newTodo,
      elements.previewAdjustment,
      elements.adjustPhase,
      elements.summarizePhase,
      elements.phasePlansCreate,
      elements.form.querySelector('button[type="submit"]'),
      ...phaseMetadataForm?.querySelectorAll("button") || [],
      ...elements.phasePlansDatabase?.querySelectorAll("button") || [],
      ...elements.weekFlowGrid?.querySelectorAll("button") || [],
      ...elements.todayFlowGrid?.querySelectorAll("button") || [],
    ];
    for (const button of buttons) {
      if (!button) continue;
      if (disabled) {
        button.dataset.disabledBeforeOperation = button.disabled ? "true" : "false";
        button.disabled = true;
      } else if (Object.prototype.hasOwnProperty.call(button.dataset, "disabledBeforeOperation")) {
        button.disabled = button.dataset.disabledBeforeOperation === "true";
        delete button.dataset.disabledBeforeOperation;
      }
    }
  }

  function setStatus(state, message) {
    elements.status.dataset.state = state;
    elements.status.textContent = message;
    if (elements.flowOperationStatus && !document.getElementById("textView")?.classList.contains("hidden")) {
      elements.flowOperationStatus.dataset.state = state;
      elements.flowOperationStatus.textContent = message;
      elements.flowOperationStatus.classList.remove("hidden");
    }
    if (elements.todayFlowOperationStatus && !document.getElementById("todayView")?.classList.contains("hidden")) {
      elements.todayFlowOperationStatus.dataset.state = state;
      elements.todayFlowOperationStatus.textContent = message;
      elements.todayFlowOperationStatus.classList.remove("hidden");
    }
  }

  function setFlowOperationStatus(state, message) {
    for (const status of [elements.todayFlowOperationStatus, elements.flowOperationStatus].filter(Boolean)) {
      status.dataset.state = state;
      status.textContent = message;
      status.classList.remove("hidden");
    }
  }

  function setConnectionState(state, message) {
    elements.connectionState.dataset.state = state;
    elements.connectionText.textContent = message;
  }

  function updateProgress(current, total, text) {
    const percentage = total ? Math.min(100, Math.round(current / total * 100)) : 0;
    elements.progressBar.style.width = `${percentage}%`;
    elements.progressText.textContent = text;
  }

  function currentWeekRange() {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const day = start.getDay();
    start.setDate(start.getDate() + (day === 0 ? -6 : 1 - day));
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return [notionDateKey(start), notionDateKey(end)];
  }

  function notionDateKey(date) {
    const value = new Date(date);
    return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
  }

  function addDays(dateKey, days) {
    const date = new Date(`${dateKey}T12:00:00`);
    date.setDate(date.getDate() + Number(days || 0));
    return notionDateKey(date);
  }

  function formatLocalDateTime(value) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("zh-CN", { hour12: false });
  }

  function timePart(value) {
    const text = String(value || "");
    if (/(?:Z|[+-]\d{2}:\d{2})$/i.test(text)) {
      const date = new Date(text);
      if (!Number.isNaN(date.getTime())) {
        return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
      }
    }
    const match = text.match(/T(\d{2}:\d{2})/);
    return match?.[1] || "";
  }

  function formatTodoSchedule(todo) {
    const start = timePart(todo?.plannedStart);
    const end = timePart(todo?.plannedEnd);
    return start && end ? `${start}–${end}` : (todo?.effortBasis === "unknown" ? "尚未排程" : "未排时间");
  }

  function formatTodoEffort(todo) {
    const effort = todo.estimatedPomodoros == null ? "投入未知" : `${todo.effortBasis === "time_budget" ? "投入预算" : "预计"} ${todo.estimatedPomodoros} 个番茄`;
    return Number.isFinite(todo.targetProgressPercent) ? `${effort} · 累计预期目标 ${todo.targetProgressPercent}%（非实际进度）` : effort;
  }

  function renderMilestoneProgress(milestone) {
    const tasks = milestone?.taskProgress;
    if (Array.isArray(tasks) && tasks.length) {
      return `<small>${tasks.map(task => `${escapeNotionHtml(task.title)}：累计预期 ${escapeNotionHtml(task.targetProgressPercent)}%`).join("；")}（非实际进度）</small>`;
    }
    // Legacy records are displayed as saved, never silently assigned a new curve.
    return Number.isFinite(milestone?.targetProgressPercent) ? `<small>累计计划目标 ${escapeNotionHtml(milestone.targetProgressPercent)}%（旧版记录，非实际进度）</small>` : "";
  }

  function compareTodosBySchedule(left, right) {
    const leftStart = timePart(left?.plannedStart);
    const rightStart = timePart(right?.plannedStart);
    if (leftStart && rightStart && leftStart !== rightStart) return leftStart.localeCompare(rightStart);
    if (leftStart && !rightStart) return -1;
    if (!leftStart && rightStart) return 1;
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    const priorityDifference = (priorityOrder[left?.priority] ?? 3) - (priorityOrder[right?.priority] ?? 3);
    if (priorityDifference) return priorityDifference;
    return String(left?.title || "").localeCompare(String(right?.title || ""), "zh-CN");
  }

  function daySpan(startKey, endKey) {
    const start = new Date(`${startKey}T12:00:00`);
    const end = new Date(`${endKey}T12:00:00`);
    return Math.max(1, Math.round((end - start) / 86400000) + 1);
  }

  function parseWeekdays(value) {
    const days = new Set();
    for (const part of String(value || "").split("/")) {
      const range = part.match(/^(\d)-(\d)$/);
      if (range) {
        const from = Number(range[1]);
        const to = Number(range[2]);
        for (let day = from; day <= to; day += 1) days.add(day);
      } else if (/^[0-6]$/.test(part)) days.add(Number(part));
    }
    return [...days];
  }

  function normalizeClock(hour, minute, source, fieldLabel) {
    const hours = Number(hour);
    const minutes = Number(minute);
    if (!Number.isInteger(hours) || hours < 0 || hours > 23 || !Number.isInteger(minutes) || minutes < 0 || minutes > 59) {
      throw new Error(`${fieldLabel}中的时间“${source}”无效，请使用 0:00–23:59。`);
    }
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  }

  function inputChunks(value) {
    return String(value || "").split(/[,，\n]+/).map((chunk) => chunk.trim()).filter(Boolean);
  }

  function assertProfileTimezoneMatchesDevice(timeZone) {
    const zone = String(timeZone || "").trim();
    let zonedClock;
    try {
      zonedClock = new Intl.DateTimeFormat("sv-SE", {
        timeZone: zone,
        year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
        hour12: false,
      }).format(new Date());
    } catch {
      throw new Error(`时区“${zone}”无效，请填写 IANA 时区，例如 Asia/Chongqing。`);
    }
    const localClock = new Intl.DateTimeFormat("sv-SE", {
      year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
      hour12: false,
    }).format(new Date());
    if (zonedClock !== localClock) {
      throw new Error(`当前版本的后台闹钟按 Windows 系统时区运行；请把个人节奏时区设置为与当前设备相同后再保存。`);
    }
  }

  function parseRecurringBlocks(value, type, fieldLabel = "时间段") {
    return inputChunks(value).map((chunk) => {
      const match = chunk.match(/^([0-6](?:-[0-6])?(?:\/[0-6])*)\s+(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})(?:\s+(.+))?$/);
      if (!match) {
        throw new Error(`${fieldLabel}“${chunk}”格式无效。请使用如“0/1/2/3/4/5/6 09:00-11:15”的格式，多段用逗号分隔。`);
      }
      const weekdays = parseWeekdays(match[1]);
      if (!weekdays.length) throw new Error(`${fieldLabel}“${chunk}”没有有效星期。`);
      const start = normalizeClock(match[2], match[3], `${match[2]}:${match[3]}`, fieldLabel);
      const end = normalizeClock(match[4], match[5], `${match[4]}:${match[5]}`, fieldLabel);
      if (start >= end) throw new Error(`${fieldLabel}“${chunk}”的结束时间必须晚于开始时间。`);
      return { weekdays, start, end, label: match[6] || "", type };
    });
  }

  function parseDateBlocks(value) {
    return inputChunks(value).map((chunk) => {
      const match = chunk.match(/^(\d{4}-\d{2}-\d{2})\s+(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})(?:\s+(.+))?$/);
      if (!match) {
        throw new Error(`指定日期例外“${chunk}”格式无效。请使用如“2026-08-12 09:00-12:00 请假”的格式。`);
      }
      const parsedDate = new Date(`${match[1]}T12:00:00`);
      if (Number.isNaN(parsedDate.getTime()) || notionDateKey(parsedDate) !== match[1]) {
        throw new Error(`指定日期例外“${chunk}”中的日期无效。`);
      }
      const start = normalizeClock(match[2], match[3], `${match[2]}:${match[3]}`, "指定日期例外");
      const end = normalizeClock(match[4], match[5], `${match[4]}:${match[5]}`, "指定日期例外");
      if (start >= end) throw new Error(`指定日期例外“${chunk}”的结束时间必须晚于开始时间。`);
      return { date: match[1], start, end, label: match[6] || "日期例外", type: "unavailable" };
    });
  }

  function formatRecurringBlocks(items) {
    return (Array.isArray(items) ? items : []).map((item) =>
      `${(item.weekdays || []).join("/")} ${item.start}-${item.end}${item.label ? ` ${item.label}` : ""}`
    ).join(", ");
  }

  function formatDateBlocks(items) {
    return (Array.isArray(items) ? items : []).map((item) =>
      `${item.date} ${item.start}-${item.end}${item.label ? ` ${item.label}` : ""}`
    ).join(", ");
  }

  function downloadMarkdown(filename, markdown) {
    const blob = new Blob(["\uFEFF", String(markdown || "")], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename || "minimal-pomodoro-daily-archive.md";
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  function friendlyError(error) {
    if (error?.name === "AbortError") return "LLM 请求超时，请检查模型服务和网络。";
    if (error?.code === "notion_timeout") return error.message;
    if (error?.status === 401) return "Notion Token 无效或已失效。";
    if (error?.status === 403) return "Notion 连接缺少读取或写入权限。";
    if (error?.status === 404) {
      const detail = String(error?.message || "").trim();
      return `Notion 找不到目标数据库或页面。请检查配置中的数据源是否仍存在并已共享给当前连接；如果发生在“应用调整”时，也可能是预览中的待办已被删除或归档。${detail ? ` Notion 原始信息：${detail}` : ""}`;
    }
    return error?.message || String(error);
  }

  function escapeNotionHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
})();
