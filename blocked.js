const params = new URLSearchParams(location.search);
const site = params.get("site") || "当前网站";
const siteText = document.getElementById("siteText");
const reasonInput = document.getElementById("reasonInput");
const minutesInput = document.getElementById("minutesInput");
const keepBtn = document.getElementById("keepBtn");
const stopBtn = document.getElementById("stopBtn");
const applyBtn = document.getElementById("applyBtn");
const backBtn = document.getElementById("backBtn");
const message = document.getElementById("message");

let stopPomodoro = false;
siteText.textContent = site;

function setStopChoice(shouldStop) {
  stopPomodoro = shouldStop;
  keepBtn.classList.toggle("active", !shouldStop);
  stopBtn.classList.toggle("active", shouldStop);
  keepBtn.setAttribute("aria-pressed", String(!shouldStop));
  stopBtn.setAttribute("aria-pressed", String(shouldStop));
}

keepBtn.addEventListener("click", () => setStopChoice(false));
stopBtn.addEventListener("click", () => setStopChoice(true));

backBtn.addEventListener("click", () => {
  if (history.length > 1) {
    history.back();
    return;
  }

  location.href = chrome.runtime.getURL("timeline.html?mode=today");
});

applyBtn.addEventListener("click", async () => {
  const reason = reasonInput.value.trim();
  if (!reason) {
    message.textContent = "请先输入申请理由。";
    reasonInput.focus();
    return;
  }

  applyBtn.disabled = true;
  backBtn.disabled = true;
  message.textContent = "正在申请访问...";

  try {
    const response = await chrome.runtime.sendMessage({
      type: "GRANT_TEMP_ACCESS",
      payload: {
        site,
        reason,
        minutes: Number(minutesInput.value),
        stopPomodoro,
      },
    });

    if (!response?.ok) {
      throw new Error(response?.error || "申请失败");
    }

    message.textContent = stopPomodoro
      ? "已停止番茄钟并临时放行，正在打开网站..."
      : "已临时放行，番茄钟继续运行，正在打开网站...";

    setTimeout(() => {
      location.href = response.payload.openUrl;
    }, 350);
  } catch (error) {
    message.textContent = `申请失败：${error?.message || error}`;
    applyBtn.disabled = false;
    backBtn.disabled = false;
  }
});

setStopChoice(false);
