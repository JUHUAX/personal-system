(function defineWorkPromptPolicy(root) {
  "use strict";

  const VERSION = "work-text-1";
  const MILESTONE_RULES = [
    "内容仅围绕用户给出的阶段目标、任务、交付物与约束，不扩展无关任务或虚构每日成果。",
    "字数按去除首尾空白后的 Unicode 字符计数，含标点、英文与内部空格。planTitle 建议 6–16 字且最多 16 字；summary 最多 120 字。",
    "每个 milestone：goal 最多 40 字；deliverables 最多 3 项，每项最多 30 字；notes 最多 80 字。taskEstimates 的 title 最多 28 字，deliverable 最多 30 字。",
    "goal 只写当日目标，deliverables 只写可核验结果，notes 只写时长、承接关系或必要风险，不重复其他字段。没有明确成果要求时保留原任务名称与时间分配，不补造完成标准。",
    "changeSummary 最多 120 字，概括实际变更。保留每天的日期、任务估时、分钟求和和工作容量校验，不为缩短文字删日期或低估耗时。",
  ].join("\n");
  const TODO_RULES = [
    "待办标题最多 28 字，details 最多 80 字；标题写具体动作，details 写明确的完成边界与必要依赖，不重复标题、不写鼓励性套话。",
    "内容优先依据用户目标、已保存待办和真实执行事实，不能增加无依据的新目标或虚构进展。生成待办默认 3–6 项、最多 8 项，调整只返回实际新增或变更项。",
    "changeSummary 最多 120 字；保留身份、日期、优先级、预计番茄数和起止时间。字数按去除首尾空白后的 Unicode 字符计数，含标点、英文与内部空格。",
  ].join("\n");
  const MANUAL_ADJUSTMENT_RULES = [
    "按 instruction 调整指定日期待办；优先遵循用户明确的任务内容、取舍、顺序和时间要求，不生成日报。",
    "protectedTodos 必须原样保留且不得删除。其他未完成待办可增删、拆分、合并或重排。",
    "用户明确指定的时间可以覆盖 planningProfile 的常规工作窗口。仅这些任务输出 workWindowOverride=true，并在 warnings 简要说明；用户没有明确指定时间时，仍遵守工作窗口与 availableWindows，不自行扩展工时。",
    "固定活动、routineBlocks、dateOverrides、任务重叠、跨日或无效时间仍属硬约束；与用户时间要求冲突时说明具体冲突，不偷偷更改用户指定时间。",
    "earliestStart 非空时不得早于该边界；requiredRescheduleTodos 中的过时未完成任务必须重排或显式删除。没有剩余工作窗口也可按用户明确要求在当天窗口外排程。",
    "todos 只包含新增或修改项，最多 8 项。deletedTodoIds 只包含明确删除的可调整待办 ID，省略不代表删除。输出 status、blockedReason、changeSummary、todos、deletedTodoIds、warnings。",
  ].join("\n");
  const MANUAL_REPAIR_RULES = [
    MANUAL_ADJUSTMENT_RULES,
    "这是手动调整的定向修复。根据 validationError 修复 candidateTodos，保留原 instruction、明确指定的时间和 deletedTodoIds；不得改回常规工作窗口或借修复改变任务目标。无法同时满足硬约束时返回 blockedReason，说明冲突。",
  ].join("\n");
  const RULES = {
    "phase_plan.decompose": MILESTONE_RULES,
    "phase_plan.adjust": MILESTONE_RULES,
    "daily_todo.initial": TODO_RULES,
    "daily_todo.generate": TODO_RULES,
    "daily_todo.adjust": TODO_RULES,
    "daily_todo.adjust_repair": TODO_RULES,
    "daily_todo.intraday_adjust": TODO_RULES,
    "daily_todo.intraday_repair": TODO_RULES,
    "daily_review.generate": [
      TODO_RULES,
      "dailySummary 以 120–180 字概括完成、未完成与证据；timeAnalysis 最多 120 字，只解释真实投入与偏差；problemAnalysis 最多 120 字，只写有证据的问题；nextFocus 保持字符串，按行最多 3 项、每项最多 60 字、总计最多 180 字。",
      "四个总结字段职责分开，不重复同一结论。事实不足时允许少于建议字数并说明缺口，不凑字数。次日任务必须有明确完成边界。",
    ].join("\n"),
    "phase_plan.summarize": [
      "phaseSummary 用 150–220 字概括阶段结论；achievementSummary 用 200–300 字对照目标说明已完成、部分完成和未完成；timeAnalysis 最多 200 字，解释真实投入和主要偏差。",
      "unfinishedItems、lessons、nextSuggestions 各最多 5 项，每项最多 80 字；分别写具体遗留事项及原因、证据支持的经验、可执行后续建议。",
      "各字段不重复，不逐日复述全部记录，不虚构成果。事实不足时允许低于建议字数并说明缺口。字数按去除首尾空白后的 Unicode 字符计数，含标点、英文与内部空格。",
    ].join("\n"),
  };

  function validateOutput(action, result) {
    if (!RULES[action] || result?.status === "blocked") return;
    const errors = [];
    const text = (value, limit, path) => {
      if (value == null) return;
      if (typeof value !== "string") {
        errors.push(`${path} 必须是字符串`);
        return;
      }
      const length = Array.from(value.trim()).length;
      if (length > limit) errors.push(`${path} 有 ${length} 字，上限 ${limit} 字`);
    };
    const list = (items, count, limit, path) => {
      if (items == null) return;
      if (!Array.isArray(items)) { errors.push(`${path} 必须是数组`); return; }
      if (items.length > count) errors.push(`${path} 有 ${items.length} 项，上限 ${count} 项`);
      items.forEach((item, index) => text(item, limit, `${path}[${index}]`));
    };
    if (action === "phase_plan.decompose" || action === "phase_plan.adjust") {
      text(result.planTitle || result.title, 16, "planTitle");
      text(result.summary || result.phaseSummary, 120, "summary");
      text(result.changeSummary, 120, "changeSummary");
      const milestones = result.milestones || result.dailyMilestones;
      if (Array.isArray(milestones)) milestones.forEach((item, index) => {
        const path = `milestones[${index}]`;
        text(item.goal || item.title || item.outcome, 40, `${path}.goal`);
        text(item.notes, 80, `${path}.notes`);
        list(item.deliverables, 3, 30, `${path}.deliverables`);
        const tasks = item.taskEstimates || item.tasks;
        if (Array.isArray(tasks)) tasks.forEach((task, taskIndex) => {
          text(task.title || task.task, 28, `${path}.taskEstimates[${taskIndex}].title`);
          text(task.deliverable || task.outcome, 30, `${path}.taskEstimates[${taskIndex}].deliverable`);
        });
      });
    } else if (action === "phase_plan.summarize") {
      text(result.phaseSummary, 220, "phaseSummary");
      text(result.achievementSummary, 300, "achievementSummary");
      text(result.timeAnalysis, 200, "timeAnalysis");
      for (const key of ["unfinishedItems", "lessons", "nextSuggestions"]) list(result[key], 5, 80, key);
    } else {
      text(result.changeSummary, 120, "changeSummary");
      const review = result.review || result;
      const todos = action === "daily_review.generate" ? result.nextDayTodos || review.nextDayTodos : result.todos || result.nextDayTodos;
      if (Array.isArray(todos)) todos.forEach((todo, index) => {
        text(todo.title, 28, `todos[${index}].title`);
        text(todo.details, 80, `todos[${index}].details`);
      });
      if (action === "daily_review.generate") {
        text(review.dailySummary, 180, "review.dailySummary");
        text(review.timeAnalysis, 120, "review.timeAnalysis");
        text(review.problemAnalysis, 120, "review.problemAnalysis");
        text(review.nextFocus, 180, "review.nextFocus");
        if (typeof review.nextFocus === "string") list(review.nextFocus.split(/\r?\n/).filter((item) => item.trim()), 3, 60, "review.nextFocus");
      }
    }
    if (errors.length) {
      const error = new Error(`模型输出需压缩：${errors.slice(0, 8).join("；")}。请保留事实、完成边界、任务 ID、日期与估时，精简文字后重新提交。`);
      error.code = "llm_output_length";
      throw error;
    }
  }
  const policy = Object.freeze({ VERSION, RULES: Object.freeze(RULES), MANUAL_ADJUSTMENT_RULES, MANUAL_REPAIR_RULES, validateOutput });
  if (typeof module !== "undefined" && module.exports) module.exports = policy;
  else root.WorkPromptPolicy = policy;
})(globalThis);
