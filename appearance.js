(function () {
  "use strict";
  const key = "personalSystemTheme";
  const documents = new Set([document]);
  let revision = 0;
  let theme = "dark";
  try { theme = localStorage.getItem(key) === "light" ? "light" : "dark"; } catch {}

  function apply(doc) {
    doc.documentElement.dataset.theme = theme;
    for (const button of doc.querySelectorAll("[data-theme-choice]")) {
      button.setAttribute("aria-pressed", String(button.dataset.themeChoice === theme));
    }
  }

  function setTheme(value, persist = true) {
    theme = value === "light" ? "light" : "dark";
    revision++;
    for (const doc of documents) {
      try { apply(doc); } catch { documents.delete(doc); }
    }
    if (persist) {
      try { localStorage.setItem(key, theme); } catch {}
      globalThis.chrome?.storage?.local?.set({ [key]: theme }).catch(() => {});
    }
  }

  function icon(name) {
    const pascalName = name.replace(/(^|-)(\w)/g, (_, _dash, letter) => letter.toUpperCase());
    const definition = globalThis.lucide?.icons?.[pascalName];
    if (!definition) return null;
    return lucide.createElement(definition, { class: "ps-icon", "aria-hidden": "true", focusable: "false" });
  }

  function decorate(root) {
    const nodes = [...root.querySelectorAll("[data-icon]")];
    if (root.matches?.("[data-icon]")) nodes.unshift(root);
    for (const node of nodes) {
      if (node.querySelector(":scope > .ps-icon")) continue;
      const svg = icon(node.dataset.icon);
      if (svg) node.prepend(svg);
    }
  }

  function registerDocument(doc) {
    documents.add(doc);
    apply(doc);
    decorate(doc);
    doc.addEventListener("click", (event) => {
      const button = event.target.closest("[data-theme-choice]");
      if (button) setTheme(button.dataset.themeChoice);
    });
  }

  globalThis.PersonalSystemUI = { icon, decorate, registerDocument, setTheme, getTheme: () => theme };
  apply(document);
  const initialRevision = revision;
  globalThis.chrome?.storage?.local?.get(key).then((stored) => {
    if (revision === initialRevision && ["light", "dark"].includes(stored[key])) setTheme(stored[key], false);
  }).catch(() => {});
  globalThis.chrome?.storage?.onChanged?.addListener((changes, area) => {
    if (area === "local" && changes[key]) setTheme(changes[key].newValue, false);
  });
  window.addEventListener("storage", (event) => {
    if (event.key === key) setTheme(event.newValue, false);
  });
  document.addEventListener("DOMContentLoaded", () => registerDocument(document));
})();
