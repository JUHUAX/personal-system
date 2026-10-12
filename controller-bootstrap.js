(() => {
  const embeddedMain = new URLSearchParams(location.search).get("main") === "1";
  if (embeddedMain) {
    document.documentElement.classList.add("main-controller");
    return;
  }
  location.replace(chrome.runtime.getURL("timeline.html?mode=today"));
})();
