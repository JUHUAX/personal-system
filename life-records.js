(function initializeLifeRecords() {
  "use strict";
  const api = window.MinimalPomodoroNotion;
  const prefix = "minimalPomodoroLifeRecords:";
  const records = new Map(), dirty = new Set(), timers = new Map(), states = new Map();
  const list = document.getElementById("lifeDayList");
  const viewStatus = document.getElementById("lifeViewStatus");
  const dateInput = document.getElementById("lifeRecordDate");
  const extraDates = new Set();
  const editingDates = new Set();
  let dateKeys = [], visible = false, writes = Promise.resolve(), loadSequence = 0, pendingFocusDate = "";

  function escape(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
  }
  function setState(date, state, message) {
    states.set(date, { state, message });
    for (const element of document.querySelectorAll(`[data-life-status="${date}"]`)) {
      element.dataset.state = state;
      element.textContent = message;
    }
  }
  function savedState(date) {
    const record = records.get(date);
    setState(date, record?.pendingSync ? "pending" : "saved", record?.pendingSync ? "已保存到本地 · 待同步" : record ? "已保存" : "");
  }
  function mount() {
    for (const input of document.querySelectorAll("textarea[data-life-date]")) {
      const date = input.dataset.lifeDate;
      if (input !== document.activeElement) input.value = records.get(date)?.text || "";
      const state = states.get(date);
      if (state) setState(date, state.state, state.message);
      else savedState(date);
    }
    for (const card of list.querySelectorAll("[data-life-card-date]")) {
      const date = card.dataset.lifeCardDate;
      const text = records.get(date)?.text || "";
      const editing = editingDates.has(date);
      card.querySelector(".life-day-text").textContent = text || "还没有记录";
      card.querySelector(".life-day-text").hidden = editing;
      card.querySelector("textarea").hidden = !editing;
      card.querySelector("[data-life-edit]").hidden = editing;
      card.querySelector("[data-life-done]").hidden = !editing;
      card.classList.toggle("is-editing", editing);
    }
  }
  function render() {
    // Keep existing editors mounted during saves and background refreshes.
    const today = localDateKey();
    dateInput.max = today;
    if (!dateInput.value) dateInput.value = today;
    const wanted = dateKeys.filter((date) => date === today || records.get(date)?.text?.trim() || dirty.has(date) || extraDates.has(date)).sort().reverse();
    list.querySelector(".life-empty")?.remove();
    for (const card of [...list.children]) if (!wanted.includes(card.dataset.lifeCardDate)) card.remove();
    for (const [index, date] of wanted.entries()) {
      let card = list.querySelector(`[data-life-card-date="${date}"]`);
      if (!card) {
        card = document.createElement("article");
        card.className = "life-day-card";
        card.dataset.lifeCardDate = date;
        const day = new Date(`${date}T12:00:00`);
        card.innerHTML = `<header><div><h3><time datetime="${date}">${date}</time></h3><span>${escape(day.toLocaleDateString("zh-CN", { weekday: "long" }))}</span></div><button class="ghost" type="button" data-life-edit data-icon="pencil" aria-label="编辑 ${date} 生活记录" title="编辑记录"></button><button class="ghost" type="button" data-life-done data-icon="check" hidden>完成</button></header><p class="life-day-text"></p><textarea data-life-date="${date}" aria-label="${date} 生活记录" placeholder="睡眠、三餐、心情、甜水…" spellcheck="false" hidden></textarea><small class="flow-save-state" data-life-status="${date}" role="status" aria-live="polite"></small>`;
        list.insertBefore(card, list.children[index] || null);
      }
      card.dataset.notionUrl = records.get(date)?.url || "";
    }
    if (!wanted.length) {
      const empty = document.createElement("p");
      empty.className = "life-empty flow-empty";
      empty.textContent = "这一周还没有生活记录";
      list.append(empty);
    }
    mount();
  }
  function localDateKey() {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }
  async function loadLocal() {
    const stored = await chrome.storage.local.get(null);
    for (const [key, value] of Object.entries(stored)) {
      if (!key.startsWith(prefix)) continue;
      const date = key.slice(prefix.length);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || dirty.has(date)) continue;
      records.set(date, value);
      savedState(date);
    }
    render();
  }
  async function acceptRemote(date, remote) {
    if (!remote || dirty.has(date) || records.get(date)?.pendingSync) return;
    const current = records.get(date);
    if (current?.text === remote.text && current?.url === remote.url) return;
    const record = { schemaVersion: 1, date, text: remote.text, url: remote.url || "", updatedAt: remote.updatedAt || "", pendingSync: false };
    // Recheck after the read: typing or a queued write wins over a stale pull.
    const saved = await api.cacheLifeRecord(date, record);
    if (saved && !dirty.has(date)) { records.set(date, saved); savedState(date); render(); }
  }
  async function refreshRemote() {
    const sequence = ++loadSequence;
    const dates = [...dateKeys].sort();
    if (!visible || !dates.length) return;
    viewStatus.dataset.state = "working";
    viewStatus.textContent = "正在同步…";
    try {
      const config = await api.getConfig();
      if (!config.token || !config.dailyReviewSourceId) {
        viewStatus.dataset.state = "saved";
        viewStatus.textContent = "本地记录";
        return;
      }
      const remote = await api.loadLifeRecordsInRange(dates[0], dates.at(-1), config);
      if (sequence !== loadSequence) return;
      for (const record of remote) await acceptRemote(record.date, record);
      viewStatus.dataset.state = "saved";
      viewStatus.textContent = "已读取 Notion";
    } catch (error) {
      if (sequence !== loadSequence) return;
      viewStatus.dataset.state = "error";
      viewStatus.textContent = "同步未完成 · 本地记录已保留";
    }
  }
  function input(event) {
    const editor = event.target.closest("textarea[data-life-date]");
    if (!editor) return;
    const date = editor.dataset.lifeDate;
    records.set(date, { ...(records.get(date) || {}), date, text: editor.value });
    dirty.add(date);
    setState(date, "dirty", "正在保存…");
    for (const peer of document.querySelectorAll(`textarea[data-life-date="${date}"]`)) if (peer !== editor) peer.value = editor.value;
    clearTimeout(timers.get(date));
    timers.set(date, setTimeout(() => save(date), 350));
  }
  function save(date) {
    clearTimeout(timers.get(date));
    const text = records.get(date)?.text || "";
    const task = writes.catch(() => {}).then(async () => {
      if (records.get(date)?.text !== text) return;
      const saved = await api.queueLifeRecord(date, text);
      if (records.get(date)?.text !== text) return;
      records.set(date, saved);
      dirty.delete(date);
      savedState(date);
    });
    writes = task;
    task.catch((error) => setState(date, "error", `${error.message || "保存失败"} · 原文已保留，请修改或重试`));
    return task;
  }
  list.addEventListener("click", async (event) => {
    const action = event.target.closest("[data-life-edit], [data-life-done]");
    if (!action) return;
    const card = action.closest("[data-life-card-date]"), date = card.dataset.lifeCardDate;
    if (action.hasAttribute("data-life-edit")) {
      editingDates.add(date); mount(); card.querySelector("textarea").focus();
    } else {
      action.disabled = true;
      try {
        if (dirty.has(date)) await save(date);
        if (!dirty.has(date)) { editingDates.delete(date); mount(); card.querySelector("[data-life-edit]").focus(); }
      } catch {} finally { action.disabled = false; }
    }
  });
  document.addEventListener("input", input);
  document.getElementById("openLifeRecordDay").addEventListener("click", () => {
    dateInput.max = localDateKey();
    if (!dateInput.value || !dateInput.checkValidity() || dateInput.value > localDateKey()) {
      dateInput.reportValidity();
      return;
    }
    extraDates.add(dateInput.value);
    editingDates.add(dateInput.value);
    pendingFocusDate = dateInput.value;
    window.dispatchEvent(new CustomEvent("minimal-pomodoro-life-date-request", { detail: { dateKey: dateInput.value } }));
  });
  document.addEventListener("focusout", (event) => {
    const date = event.target.dataset.lifeDate;
    if (date && dirty.has(date)) save(date);
    else if (date) mount();
  });
  window.addEventListener("beforeunload", (event) => {
    if (dirty.size) { event.preventDefault(); event.returnValue = ""; }
  });
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && Object.keys(changes).some((key) => key.startsWith(prefix))) {
      loadLocal().catch(() => { viewStatus.textContent = "本地记录读取失败"; });
    }
  });
  window.addEventListener("minimal-pomodoro-week-flow-rendered", (event) => {
    const next = event.detail.dateKeys;
    const changed = next.join() !== dateKeys.join();
    dateKeys = next;
    render();
    if (visible && pendingFocusDate) {
      const input = list.querySelector(`textarea[data-life-date="${pendingFocusDate}"]`);
      if (input) { input.focus(); pendingFocusDate = ""; }
    }
    if (visible && (changed || event.detail.remote)) refreshRemote();
  });
  window.addEventListener("minimal-pomodoro-today-date-rendered", mount);
  window.addEventListener("minimal-pomodoro-mode-change", (event) => {
    visible = event.detail.mode === "life";
    if (visible) { render(); refreshRemote(); }
  });
  window.addEventListener("focus", () => { if (visible) render(); });
  window.setInterval(() => { if (visible) render(); }, 30000);
  window.DailyLifeRecords = Object.freeze({ acceptRemote });
  loadLocal().catch(() => { viewStatus.textContent = "本地记录读取失败"; });
})();
