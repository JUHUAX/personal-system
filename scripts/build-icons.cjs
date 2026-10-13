const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");
const root = path.resolve(__dirname, "..");

(async () => {
  const executablePath = process.env.BROWSER_EXECUTABLE || [
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
  ].find(fs.existsSync);
  const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
  try {
    const page = await browser.newPage();
    await page.addScriptTag({ path: path.join(root, "vendor/lucide.min.js") });
    for (const size of [16, 32, 48, 128]) {
      const data = await page.evaluate(async (size) => {
        const svg = lucide.createElement(lucide.icons.PanelsTopLeft, { width: 88, height: 88, stroke: "#70d5b5", "stroke-width": 1.8 });
        const image = new Image();
        const src = new XMLSerializer().serializeToString(svg);
        image.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(src);
        await image.decode();
        const canvas = document.createElement("canvas");
        canvas.width = size; canvas.height = size;
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#19372e";
        ctx.beginPath(); ctx.roundRect(0, 0, size, size, size * .18); ctx.fill();
        ctx.drawImage(image, size * .16, size * .16, size * .68, size * .68);
        return canvas.toDataURL("image/png").split(",")[1];
      }, size);
      fs.writeFileSync(path.join(root, `icons/icon${size}.png`), Buffer.from(data, "base64"));
    }
    console.log("Personal System icons generated from the bundled Lucide brand mark");
  } finally { await browser.close(); }
})().catch((error) => { console.error(error); process.exitCode = 1; });
