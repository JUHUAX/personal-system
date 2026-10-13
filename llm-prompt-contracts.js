(function(root) {
  "use strict";
  const outputFields = {
    "O.RECORDS": "records",
    "O.PHASE_CREATE": "planTitle summary assumptions questions milestones",
    "O.PHASE_ADJUST": "changeSummary milestones warnings",
    "O.DAY_GENERATE": "todos fixedSchedule deferredTodos warnings",
    "O.MANUAL_DELTA": "changeSummary todos deletedTodoIds warnings",
    "O.AUTO_DELTA": "changeSummary todos deletedTodoIds warnings",
    "O.REVIEW_NEXT": "review nextDayTodos fixedSchedule deferredTodos warnings",
    "O.PHASE_SUMMARY": "phaseSummary achievementSummary timeAnalysis unfinishedItems lessons nextSuggestions",
  };
  const inputFields = {
    "time_record.parse": "selectedDate timezone instruction existingRecords",
    "phase_plan.decompose": "plan planningProfile effectiveDailyCapacity progressContext",
    "daily_todo.initial": "date phasePlan dayMilestone planningProfile requestedAt preparationMinutes earliestStart availableWindows previousDayContext progressContext dailyWorkBudgetPomodoros",
    "daily_todo.generate": "date phasePlan dayMilestone planningProfile requestedAt preparationMinutes earliestStart availableWindows previousDayContext progressContext dailyWorkBudgetPomodoros",
    "daily_review.generate": "date nextTodoDate timezone generateNextTodos userCompletion currentPhasePlan phasePlan nextDayMilestone planningProfile todos existingNextTodos records statistics progressContext dailyWorkBudgetPomodoros",
    "daily_todo.adjust": "date instruction phasePlan dayMilestone planningProfile todos protectedTodos adjustableTodos requiredRescheduleTodos requestedAt preparationMinutes earliestStart availableWindows progressContext dailyWorkBudgetPomodoros",
    "daily_todo.intraday_adjust": "date currentTime phasePlan dayMilestone planningProfile todos protectedTodos adjustableTodos requiredRescheduleTodos availableWindows records userCompletion progressContext dailyWorkBudgetPomodoros",
    "daily_todo.adjust_repair": "date instruction phasePlan dayMilestone planningProfile todos protectedTodos adjustableTodos requiredRescheduleTodos requestedAt preparationMinutes earliestStart currentTime availableWindows candidateTodos deletedTodoIds validationError progressContext dailyWorkBudgetPomodoros",
    "daily_todo.intraday_repair": "date currentTime earliestStart phasePlan dayMilestone planningProfile availableWindows todos protectedTodos adjustableTodos requiredRescheduleTodos candidateTodos deletedTodoIds fixedSchedule deferredTodos validationError progressContext dailyWorkBudgetPomodoros",
    "phase_plan.adjust": "today plan instruction records dailyContext planningProfile effectiveDailyCapacity progressContext",
    "phase_plan.summarize": "plan records dailyContext statistics timezone asOf",
  };
  const fail = message => { const error = new Error(`模型契约校验失败：${message}`); error.code = "llm_contract"; throw error; };
  const object = v => v !== null && typeof v === "object" && !Array.isArray(v);
  const date = v => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) && Number.isFinite(Date.parse(v)) && new Date(v).toISOString().slice(0,10) === v;
  const iso = v => typeof v === "string" && /T.*(?:Z|[+-]\d{2}:\d{2})$/.test(v) && Number.isFinite(Date.parse(v));
  const keys = (v, required, optional = [], path = "结果") => {
    if (!object(v) || required.some(k => !Object.hasOwn(v,k)) || Object.keys(v).some(k => !required.includes(k) && !optional.includes(k))) fail(`${path}字段缺失或含未声明字段`);
  };
  const string = (v,p) => { if (typeof v !== "string") fail(`${p}必须为字符串`); };
  const array = (v,p) => { if (!Array.isArray(v)) fail(`${p}必须为数组`); };
  const strings = (v,p) => { array(v,p); v.forEach(x=>string(x,p)); };
  const percent = (n,p) => {
    if (!Number.isFinite(n) || n<0 || n>100 || Math.abs(n*10-Math.round(n*10))>1e-7) fail(`${p}缺少数字累计预期百分比或百分比无效`);
  };
  const mode = (v,p, allowMirrorNull = false) => {
    if (!["explicit","percentage"].includes(v.planningMode)) fail(`${p}.planningMode无效`);
    const n=v.targetProgressPercent;
    if (!(allowMirrorNull && n === null)) percent(n,p);
  };
  function normalizeTaskInput(definition, raw) {
    const input = structuredClone(raw || {});
    if (definition.action === "daily_todo.intraday_adjust" && !Object.hasOwn(input,"todos")) input.todos = [...(input.protectedTodos || []), ...(input.adjustableTodos || [])];
    // Local records store milliseconds; the model always receives timezone-aware ISO values.
    function normalizeRecords(records) {
      if (!Array.isArray(records)) return;
      for (const record of records) for (const key of ["start","end"]) {
        if (typeof record[key] === "number" && Number.isFinite(record[key])) record[key] = new Date(record[key]).toISOString();
      }
    }
    normalizeRecords(input.records); normalizeRecords(input.existingRecords);
    normalizeRecords(input.previousDayContext?.records);
    for (const day of input.dailyContext || []) normalizeRecords(day.records);
    for (const k of ["currentTime","earliestStart","requestedAt"]) {
      if(typeof input[k] === "string" && !iso(input[k]) && Number.isFinite(Date.parse(input[k]))) input[k]=new Date(input[k]).toISOString();
    }
    for(const w of input.availableWindows || []) for(const k of ["start","end"]) {
      if(typeof w[k] === "string" && !iso(w[k]) && Number.isFinite(Date.parse(w[k]))) w[k]=new Date(w[k]).toISOString();
    }
    return input;
  }
  function pickDeclaredInputFields(definition, input) {
    return Object.fromEntries([...inputFields[definition.action].split(" "),"outputLengthFeedback","previousResult"].filter(k=>Object.hasOwn(input,k)).map(k=>[k,input[k]]));
  }
  function validateTaskInput(d, input) {
    if (!object(input)) fail("输入必须为对象");
    const requireField = k => { if (!Object.hasOwn(input,k) || input[k] == null) fail(`输入缺少${k}`); };
    const requireArray = k => { requireField(k); array(input[k],k); };
    const requireDate = k => { requireField(k); if(!date(input[k])) fail(`${k}日期无效`); };
    const requireText = k => { requireField(k); if(typeof input[k] !== "string" || !input[k].trim()) fail(`${k}不能为空`); };
    if (d.action === "time_record.parse") {
      requireDate("selectedDate"); requireText("instruction"); requireText("timezone"); requireArray("existingRecords");
      try { new Intl.DateTimeFormat("en",{timeZone:input.timezone}); } catch { fail("timezone无效"); }
    } else if (d.action.startsWith("phase_plan.")) {
      requireField("plan");
      if(!date(input.plan.startDate) || !date(input.plan.endDate) || input.plan.endDate<input.plan.startDate || !String(input.plan.description || input.plan.goals || "").trim()) fail("阶段日期或目标无效");
      if(d.action === "phase_plan.adjust") { requireDate("today"); requireText("instruction"); requireArray("records"); requireArray("dailyContext"); }
      if(d.action === "phase_plan.summarize") { requireArray("records"); requireArray("dailyContext"); }
    } else {
      requireDate("date");
      if(d.action === "daily_review.generate") {
        requireText("userCompletion"); requireDate("nextTodoDate"); requireText("timezone");
        requireArray("todos"); requireArray("records"); requireArray("existingNextTodos");
        if(typeof input.generateNextTodos !== "boolean") fail("缺少generateNextTodos布尔值");
        if(input.generateNextTodos) { requireField("phasePlan"); requireField("nextDayMilestone"); if(input.nextDayMilestone.date !== input.nextTodoDate) fail("次日里程碑日期不匹配"); }
      } else if(d.action === "daily_todo.initial" || d.action === "daily_todo.generate") {
        requireField("phasePlan"); requireField("dayMilestone");
        if(input.dayMilestone.date !== input.date) fail("里程碑日期不匹配");
        if(d.action === "daily_todo.initial" && input.date !== input.phasePlan.startDate) fail("首日日期不匹配");
      } else {
        if(d.action.includes("repair")) { requireArray("candidateTodos"); requireText("validationError"); }
        const generation = ["initial_generate","day_generate"].includes(d.variant);
        if (!generation) {
          for(const k of ["protectedTodos","adjustableTodos","requiredRescheduleTodos"]) requireArray(k);
          if(d.action !== "daily_todo.intraday_adjust") requireArray("todos");
          if(d.action.includes("repair")) requireArray("deletedTodoIds");
        }
        if(d.action === "daily_todo.adjust" || d.action === "daily_todo.adjust_repair") requireText("instruction");
        if(d.action === "daily_todo.intraday_adjust" || d.action === "daily_todo.intraday_repair") {
          requireField("availableWindows");
          if(!Array.isArray(input.availableWindows)) fail("availableWindows必须为数组");
          if(!iso(generation ? input.earliestStart || input.currentTime : input.currentTime)) fail("修复/自动调整的时间边界无效");
        }
      }
    }
    for(const key of ["availableWindows","previousDayContext","progressContext","planningProfile","statistics"]) {
      if(input[key] != null && (key === "availableWindows" ? !Array.isArray(input[key]) : !object(input[key]))) fail(`${key}类型无效`);
    }
    if(input.preparationMinutes != null && (!Number.isInteger(input.preparationMinutes) || input.preparationMinutes<0 || input.preparationMinutes>120)) fail("preparationMinutes须为0–120整数");
    if(input.dailyWorkBudgetPomodoros != null && (!Number.isInteger(input.dailyWorkBudgetPomodoros) || input.dailyWorkBudgetPomodoros<0)) fail("dailyWorkBudgetPomodoros须为非负整数或null");
    for(const records of [input.records,input.existingRecords,input.previousDayContext?.records]) {
      if(records !== undefined && records !== null) {
        array(records,"records");
        for(const record of records) if(!object(record) || !iso(record.start) || record.end != null && (!iso(record.end) || Date.parse(record.end)<=Date.parse(record.start))) fail("输入时间记录的时间或单位无效");
      }
    }
    for(const w of input.availableWindows || []) if(!object(w) || !iso(w.start) || !iso(w.end) || Date.parse(w.end)<=Date.parse(w.start)) fail("可用窗口时间无效");
    if(input.outputLengthFeedback !== undefined && (!object(input.previousResult) || typeof input.outputLengthFeedback !== "string")) fail("长度重试缺少原始结果或反馈");
  }
  function validateOutput(d, input, result) {
    const fields = ["status","blockedReason",...outputFields[d.outputContract].split(" ")];
    keys(result,fields);
    if(!["ok","blocked"].includes(result.status)) fail("status无效");
    string(result.blockedReason,"blockedReason");
    if(result.status === "ok" && result.blockedReason !== "") fail("ok时blockedReason必须为空");
    for(const key of fields.slice(2)) {
      if(["records","milestones","todos","nextDayTodos","fixedSchedule","deferredTodos","warnings","deletedTodoIds","assumptions","questions","unfinishedItems","lessons","nextSuggestions"].includes(key)) array(result[key],key);
      else if(key !== "review") string(result[key],key);
      if(result.status === "blocked" && !["questions","warnings"].includes(key) && result[key] !== null && result[key].length !== 0) fail("blocked不允许业务结果");
    }
    for(const key of ["deferredTodos","warnings","deletedTodoIds","assumptions","questions","unfinishedItems","lessons","nextSuggestions"]) if(Object.hasOwn(result,key)) strings(result[key],key);
    if(result.status === "blocked") { if(!result.blockedReason.trim() || (Object.hasOwn(result,"review") && result.review !== null)) fail("blocked缺少原因或review非null"); return; }
    if(result.review !== undefined) {
      keys(result.review,["dailySummary","timeAnalysis","problemAnalysis","nextFocus"]);
      Object.values(result.review).forEach(x=>string(x,"review"));
      if(input.generateNextTodos === false && (result.nextDayTodos.length || result.fixedSchedule.length || result.deferredTodos.length)) fail("只复盘不能生成次日安排");
    }
    const delta=["O.MANUAL_DELTA","O.AUTO_DELTA"].includes(d.outputContract);
    const manual=d.outputContract === "O.MANUAL_DELTA";
    const identities = new Set();
    for(const [i,t] of (result.todos || result.nextDayTodos || []).entries()) {
      const p=`todos[${i}]`;
      keys(t,"planningMode targetProgressPercent phaseTaskId effortBasis title details priority estimatedPomodoros source plannedStart plannedEnd origin".split(" ").concat(manual?["workWindowOverride"]:[]),delta?["id","externalId"]:[],p);
      mode(t,p); for(const k of ["title","details","source"]) string(t[k],p+"."+k);
      if(t.phaseTaskId !== null) {
        string(t.phaseTaskId,p+".phaseTaskId");
        const milestone = input.dayMilestone || input.nextDayMilestone;
        const target = milestone?.taskProgress?.find(x=>x.taskId === t.phaseTaskId);
        if(milestone?.taskProgress && (!target || target.targetProgressPercent !== t.targetProgressPercent)) fail(`${p}阶段任务ID或预期比例不匹配`);
        if(!t.phaseTaskId.trim()) fail(`${p}阶段任务ID不能为空`);
      }
      const dayTarget = input.dayMilestone || input.nextDayMilestone;
      if(["daily_todo.initial","daily_todo.generate","daily_review.generate"].includes(d.action) && dayTarget?.taskProgress?.length && t.phaseTaskId === null) fail(`${p}阶段生成待办必须关联具体任务进度`);
      if(!t.title.trim() || !["high","medium","low"].includes(t.priority) || !["user","llm"].includes(t.origin)) fail(`${p}标题/枚举无效`);
      if(!["task_estimate","time_budget","unknown"].includes(t.effortBasis)) fail(`${p}投入依据无效`);
      if(t.effortBasis === "unknown") {
        if(t.planningMode !== "percentage" || t.estimatedPomodoros !== null || t.plannedStart !== null || t.plannedEnd !== null) fail(`${p}未知投入必须是未排程比例目标`);
      } else if(!Number.isInteger(t.estimatedPomodoros) || t.estimatedPomodoros<1 || t.estimatedPomodoros>20 || !iso(t.plannedStart) || !iso(t.plannedEnd) || Date.parse(t.plannedEnd)<=Date.parse(t.plannedStart)) fail(`${p}番茄数或排程无效`);
      if(t.planningMode === "percentage" && t.effortBasis === "task_estimate") fail(`${p}比例不证明任务估时`);
      if(manual && typeof t.workWindowOverride !== "boolean") fail(`${p}覆盖标记无效`);
      const identity=t.id || t.externalId;
      if(identity) {
        if(identities.has(identity)) fail("修改ID重复");
        identities.add(identity);
        const original=(input.todos || [...(input.protectedTodos || []), ...(input.adjustableTodos || [])]).find(x=>[x.id,x.externalId].includes(identity));
        if(!original || (input.protectedTodos || []).some(x=>[x.id,x.externalId].includes(identity))) fail(`${p}修改未知或受保护ID`);
        if(t.origin !== original.origin || t.source !== original.source) fail(`${p}修改改变来源归属`);
        if(original.phaseTaskId && t.phaseTaskId !== original.phaseTaskId) fail(`${p}修改改变阶段任务归属`);
        if(t.id && ![original.id,original.externalId].includes(t.id) || t.externalId && original.externalId !== t.externalId) fail(`${p}身份字段不一致`);
      } else {
        if(t.origin !== "llm") fail(`${p}新增来源应为llm`);
        if(delta && (input.todos || [...(input.protectedTodos || []),...(input.adjustableTodos || [])]).some(x=>String(x.title || "").trim().toLowerCase() === t.title.trim().toLowerCase())) fail(`${p}修改原待办必须保留ID`);
      }
    }
    if(delta) {
      const deleted=result.deletedTodoIds;
      if(new Set(deleted).size !== deleted.length) fail("删除ID重复");
      for(const id of deleted) if(!(input.adjustableTodos || []).some(x=>[x.id,x.externalId].includes(id)) || (input.protectedTodos || []).some(x=>[x.id,x.externalId].includes(id))) fail("删除未知或受保护ID");
      if((input.deletedTodoIds || []).some(id=>!deleted.includes(id))) fail("修复丢失原删除决定");
      if((result.todos || []).some(t=>deleted.includes(t.id) || deleted.includes(t.externalId))) fail("同一ID同时修改和删除");
    }
    for(const m of result.milestones || []) {
      keys(m,"date planningMode targetProgressPercent taskProgress goal deliverables taskEstimates estimatedMinutes notes".split(" "));
      array(m.taskProgress,"taskProgress");
      if(!m.taskProgress.length && !(m.estimatedMinutes === 0 && /休息|缓冲|空白|不工作/.test(m.goal))) fail("有任务的里程碑必须给任务进度，不能用空数组省略百分比");
      mode(m,"milestone",m.taskProgress.length !== 1);
      const ids = new Set();
      for(const task of m.taskProgress) {
        keys(task,["taskId","title","targetProgressPercent"]);
        string(task.taskId,"taskId"); string(task.title,"task.title"); percent(task.targetProgressPercent,"taskProgress");
        if(!task.taskId.trim() || !task.title.trim() || ids.has(task.taskId)) fail("任务进度缺少身份、标题或同日ID重复");
        ids.add(task.taskId);
      }
      if(m.taskProgress.length === 1 && m.targetProgressPercent !== m.taskProgress[0].targetProgressPercent) fail("单任务日镜像百分比不一致");
      if(m.taskProgress.length !== 1 && m.targetProgressPercent !== null) fail("多任务日不能混成统一进度");
      if(!date(m.date)) fail("里程碑日期无效");
      string(m.goal,"goal"); string(m.notes,"notes"); strings(m.deliverables,"deliverables"); array(m.taskEstimates,"taskEstimates");
      for(const t of m.taskEstimates) { keys(t,["title","estimatedMinutes","deliverable"]); string(t.title,"title"); string(t.deliverable,"deliverable"); if(!Number.isInteger(t.estimatedMinutes) || t.estimatedMinutes<=0) fail("任务估时无效"); }
      if(m.estimatedMinutes !== null && (!Number.isInteger(m.estimatedMinutes) || m.estimatedMinutes<0)) fail("里程碑估时无效");
      if(m.planningMode === "percentage" && (m.deliverables.length || m.taskEstimates.length)) fail("比例规划不能虚构交付物/任务估时");
      if(m.taskEstimates.length && m.estimatedMinutes !== m.taskEstimates.reduce((n,t)=>n+t.estimatedMinutes,0)) fail("任务分钟和不一致");
    }
    if(result.milestones) {
      const last = new Map();
      const taskByTitle = new Map();
      const originalTaskByTitle = new Map((input.plan.milestones || []).flatMap(m=>(m.taskProgress || []).map(t=>[t.title,t.taskId])));
      const start = d.action === "phase_plan.adjust" && input.today > input.plan.startDate ? input.today : input.plan.startDate;
      const expected=[];
      for(let current=start; current<=input.plan.endDate;) { expected.push(current); const next=new Date(current+"T00:00:00Z");next.setUTCDate(next.getUTCDate()+1);current=next.toISOString().slice(0,10); }
      if(JSON.stringify(result.milestones.map(m=>m.date)) !== JSON.stringify(expected)) fail("阶段日期必须完整覆盖且按升序，不能重复或遗漏");
      for(const m of result.milestones) for(const task of m.taskProgress) {
        const priorId=taskByTitle.get(task.title) || (d.action === "phase_plan.adjust" ? originalTaskByTitle.get(task.title) : null);
        if(priorId && priorId !== task.taskId) fail("同任务不能因日期或调整而更换ID");
        taskByTitle.set(task.title,task.taskId);
        const previous=last.get(task.taskId);
        if(previous && (previous.title !== task.title || previous.targetProgressPercent>task.targetProgressPercent)) fail("同任务身份改变或累计预期进度倒退");
        last.set(task.taskId,task);
      }
      // User-supplied curves take precedence, including a partial goal at the phase end.
      if(!/[0-9]+(?:\.[0-9]+)?\s*[%％]/.test(String(input.plan.description || input.plan.goals || "")+String(input.plan.constraints || ""))) {
        for(const task of last.values()) if(task.targetProgressPercent !== 100) fail(`任务${task.title}最后推进日预期目标须为100%`);
      }
    }
    for(const r of result.records || []) {
      keys(r,["type","content","start","end","note"]);
      if(!["work","break","life","entertainment"].includes(r.type) || !iso(r.start) || !iso(r.end) || Date.parse(r.end)<=Date.parse(r.start)) fail("时间记录无效");
      string(r.content,"content"); string(r.note,"note");
    }
    for(const f of result.fixedSchedule || []) { keys(f,["title","start","end"]); string(f.title,"title"); if(!iso(f.start) || !iso(f.end) || Date.parse(f.end)<=Date.parse(f.start)) fail("固定活动时间无效"); }
    if(input.outputLengthFeedback && input.previousResult) {
      // A compression retry may edit prose, never IDs, dates, modes, budgets or decisions.
      const invariantKeys = new Set("id externalId taskId phaseTaskId date planningMode targetProgressPercent effortBasis priority estimatedPomodoros estimatedMinutes source plannedStart plannedEnd origin workWindowOverride start end type status".split(" "));
      const signature = value => {
        if(Array.isArray(value)) return value.map(signature);
        if(!object(value)) return null;
        return Object.fromEntries(Object.entries(value).filter(([k,v])=>invariantKeys.has(k) || k === "deletedTodoIds" || Array.isArray(v) && v.some(object) || object(v)).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>[k,invariantKeys.has(k) || k === "deletedTodoIds" ? v : signature(v)]));
      };
      if(JSON.stringify(signature(result)) !== JSON.stringify(signature(input.previousResult))) fail("长度重试改变了身份、日期、估时或业务决定");
    }
    validateLengths(result);
  }
  function validateLengths(result) {
    const errors=[];
    function text(v,n,p) { if(typeof v === "string" && Array.from(v.trim()).length>n) errors.push(`${p}最多${n}字`); }
    function list(v,n,p) { if(v?.length>n) errors.push(`${p}最多${n}项`); }
    const limits={planTitle:16,summary:120,changeSummary:120,phaseSummary:220,achievementSummary:300,timeAnalysis:200};
    for(const [k,n] of Object.entries(limits)) text(result[k],n,k);
    for(const k of ["todos","nextDayTodos"]) { list(result[k],8,k); for(const t of result[k] || []) {text(t.title,28,k+".title");text(t.details,80,k+".details");} }
    list(result.records,24,"records"); for(const r of result.records || []) text(r.content,40,"content");
    for(const m of result.milestones || []) {text(m.goal,40,"goal");text(m.notes,80,"notes");list(m.deliverables,3,"deliverables");m.deliverables.forEach(x=>text(x,30,"deliverable"));m.taskEstimates.forEach(t=>{text(t.title,28,"task.title");text(t.deliverable,30,"task.deliverable");});}
    for(const m of result.milestones || []) for(const t of m.taskProgress || []) { text(t.taskId,100,"taskId");text(t.title,28,"taskProgress.title"); }
    for(const k of ["unfinishedItems","lessons","nextSuggestions"]) {list(result[k],5,k); for(const v of result[k] || []) text(v,80,k);}
    if(result.review) {for(const [k,n] of Object.entries({dailySummary:180,timeAnalysis:120,problemAnalysis:120,nextFocus:180})) text(result.review[k],n,k);const lines=result.review.nextFocus.split(/\r?\n/).filter(x=>x.trim());list(lines,3,"nextFocus");lines.forEach(x=>text(x,60,"nextFocus"));}
    if(errors.length) {const error=new Error(errors.slice(0,8).join("；"));error.code="llm_output_length";throw error;}
  }
  const api={normalizeTaskInput,pickDeclaredInputFields,validateTaskInput,validateOutput};
  if(typeof module !== "undefined" && module.exports) module.exports=api; else root.LlmPromptContracts=api;
})(globalThis);
