(function initializeNotionContextMenu() {
  "use strict";
  const menu = document.createElement("div");
  menu.className = "timeline-context-menu notion-context-menu hidden";
  menu.id = "notionContextMenu";
  menu.setAttribute("role", "menu");
  menu.setAttribute("aria-label", "记录操作");
  document.body.append(menu);
  let origin = null;
  let scrollPositions = new Map();
  function safeUrl(value) {
    try {
      const url = new URL(value);
      return url.protocol === "https:" &&
        ["notion.so", "notion.site"].some((host) => url.hostname === host || url.hostname.endsWith(`.${host}`))
        ? url.href : null;
    } catch { return null; }
  }
  function close() { menu.classList.add("hidden"); }
  function open(event, target, x, y) {
    const links = [
      ["在 Notion 中查看", target.dataset.notionUrl],
      ["查看 Notion 每日归档", target.dataset.notionArchiveUrl],
    ].map(([label, value]) => [label, safeUrl(value)]).filter(([, url]) => url);
    const todo = target.closest(".flow-todo-item[data-todo-id]");
    const actions = todo ? [["开始", "start-todo"], ["编辑", "edit-todo"], ["删除", "delete-todo"]] : [];
    if (!links.length && !actions.length) return;
    event.preventDefault();
    // Native dialogs make the rest of the document inert, including body menus.
    (target.closest("dialog[open]") || document.body).append(menu);
    origin = document.activeElement;
    scrollPositions = new Map([[document, [window.scrollX, window.scrollY]]]);
    for (let parent = target; parent; parent = parent.parentElement) scrollPositions.set(parent, [parent.scrollLeft, parent.scrollTop]);
    menu.replaceChildren();
    for (const [label, action] of actions) {
      const item = document.createElement("button");
      item.type = "button";
      item.setAttribute("role", "menuitem");
      item.textContent = label;
      item.dataset.icon = action === "start-todo" ? "play" : action === "edit-todo" ? "pencil" : "trash-2";
      if (action === "delete-todo") item.className = "danger-action";
      item.onclick = () => {
        close();
        origin?.focus?.();
        window.dispatchEvent(new CustomEvent("minimal-pomodoro-todo-menu-action", {
          detail: { action, todoId: todo.dataset.todoId, dateKey: todo.closest("[data-flow-date]")?.dataset.flowDate },
        }));
      };
      menu.append(item);
    }
    for (const [label, url] of links) {
      const item = document.createElement("button");
      item.type = "button";
      item.setAttribute("role", "menuitem");
      item.textContent = label;
      item.dataset.icon = "external-link";
      item.onclick = () => {
        close();
        chrome.tabs.create({ url, active: true }).catch(() => {});
        origin?.focus?.();
      };
      menu.append(item);
    }
    window.dispatchEvent(new CustomEvent("minimal-pomodoro-notion-contextmenu"));
    menu.classList.remove("hidden");
    const rect = menu.getBoundingClientRect();
    menu.style.left = `${Math.max(8, Math.min(x, window.innerWidth - rect.width - 8))}px`;
    menu.style.top = `${Math.max(8, Math.min(y, window.innerHeight - rect.height - 8))}px`;
    menu.querySelector("button").focus({ preventScroll: true });
  }
  document.addEventListener("contextmenu", (event) => {
    close();
    const target = event.target.closest(".flow-todo-item[data-todo-id], [data-notion-url], [data-notion-archive-url]");
    if (target) open(event, target, event.clientX, event.clientY);
  });
  document.addEventListener("pointerdown", (event) => { if (!menu.contains(event.target)) close(); });
  document.addEventListener("keydown", (event) => {
    if (!menu.classList.contains("hidden")) {
      if (event.key === "Escape") { event.preventDefault(); close(); origin?.focus?.(); }
      if (["ArrowDown", "ArrowUp"].includes(event.key)) {
        event.preventDefault();
        const items = [...menu.querySelectorAll("button")];
        const index = items.indexOf(document.activeElement);
        items[(index + (event.key === "ArrowDown" ? 1 : -1) + items.length) % items.length].focus();
      }
      if (event.key === "Tab") close();
    } else if (event.key === "ContextMenu" || event.key === "F10" && event.shiftKey) {
      const target = event.target.closest(".flow-todo-item[data-todo-id], [data-notion-url], [data-notion-archive-url]");
      if (target) { const rect = target.getBoundingClientRect(); open(event, target, rect.left, rect.bottom); }
    }
  });
  window.addEventListener("scroll", (event) => {
    const before = scrollPositions.get(event.target);
    const after = event.target === document ? [window.scrollX, window.scrollY] : [event.target.scrollLeft, event.target.scrollTop];
    // Focus can dispatch an already-completed scroll after the menu opens.
    if (!before || before.some((value, index) => value !== after[index])) close();
  }, true);
  window.addEventListener("blur", close);
  document.addEventListener("close", (event) => {
    if (event.target.contains(menu)) close();
  }, true);
})();
