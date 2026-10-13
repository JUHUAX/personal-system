const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const root = path.resolve(__dirname, "..");
const read = (name) => fs.readFileSync(path.join(root, name), "utf8");
function exists(reference, origin) {
  if (/^(https?:|#)/.test(reference)) return;
  const target = path.resolve(root, reference.split(/[?#*]/)[0]);
  assert.ok(target.startsWith(root + path.sep), `${origin}: unexpected local reference ${reference}`);
  assert.ok(fs.existsSync(target), `${origin}: missing local file ${reference}`);
}
const manifest = JSON.parse(read("manifest.json"));
exists(manifest.background.service_worker, "manifest.json");
for (const icons of [manifest.icons, manifest.action.default_icon])
  for (const file of Object.values(icons)) exists(file, "manifest.json");
for (const file of fs.readdirSync(root)) {
  if (file.endsWith(".js")) {
    const source = read(file);
    new vm.Script(source, { filename: file });
    for (const match of source.matchAll(/getURL\(["']([^"']+)["']/g)) exists(match[1], file);
  }
  if (file.endsWith(".html")) {
    for (const match of read(file).matchAll(/<(?:script|link|iframe)\b[^>]*\b(?:src|href)=["']([^"']+)["']/g))
      exists(match[1], file);
  }
}
for (const file of ["README.md", "NOTION_INTEGRATION.md", "LLM_PROMPTS_V1.md", "VERSION.md"])
  for (const match of read(file).matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) exists(match[1], file);
const unused = ["reviewLabel", "normalizeInspirationText", "formatMonthDay"];
for (const name of unused) assert.equal(read("timeline.js").includes(`function ${name}(`), false);
for (const selector of [".review-choice", ".review-options", ".review-label", ".review-group"])
  assert.equal(read("controller.js").includes(selector), false);
for (const selector of [".flow-notion-link", ".notion-card-link", ".notion-plan-item", ".phase-summary-card", ".flow-todo-actions"])
  assert.equal(read("timeline.css").includes(selector), false);

const prompts = require("../llm-prompts.js");
const snapshot = read("LLM_PROMPTS_V2.md").replace(/\r\n/g, "\n");
const snapshots = [...snapshot.slice(snapshot.indexOf("## 12.")).matchAll(/\x60\x60\x60text\n([\s\S]*?)\n\x60\x60\x60/g)].map(m => m[1]);
assert.equal(prompts.definitions.length, 13);
assert.equal(new Set(prompts.definitions.map(d=>d.action)).size, 11);
for (const [index, definition] of prompts.definitions.entries()) {
  assert.equal(prompts.compileSystem(definition.action,definition.variant).system, snapshots[index], definition.key+" snapshot drift");
}
for (const name of ["llm-prompt-registry.js","llm-prompt-examples.js","llm-prompt-contracts.js","llm-prompts.js"]) {
  assert.ok(read("background.js").includes(name));
  assert.ok(read("timeline.html").includes(name));
}
console.log("Repository: runtime references, syntax, documentation links and 13 exact V2 prompt snapshots passed");
