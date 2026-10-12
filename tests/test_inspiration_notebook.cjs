const assert = require("node:assert/strict");
const notebook = require("../inspiration-notebook.js");
const today = "2026-10-12";
const notes = { "2026-10-09": "灵感 A\n第二行", "2026-10-10": "", [today]: "灵感 B\n  保留格式  " };
const text = notebook.serialize(notes, today);
assert.equal(text, "灵感 A\n第二行\n\n--- 2026-10-09 ---\n\n灵感 B\n  保留格式  ");
assert.equal(text.includes("2026-10-10"), false);
assert.deepEqual(notebook.parse(text, today), { "2026-10-09": notes["2026-10-09"], [today]: notes[today] });
const rolled = notebook.rollover(text, today, "2026-10-13");
assert.match(rolled, /--- 2026-10-12 ---\n\n$/);
assert.deepEqual(notebook.parse(rolled + "新一天的想法", "2026-10-13"), {
  "2026-10-09": notes["2026-10-09"], [today]: notes[today], "2026-10-13": "新一天的想法",
});
assert.equal(notebook.rollover("", today, "2026-10-13"), "");
assert.equal(notebook.rollover(text, today, today), text);
assert.throws(() => notebook.parse("A\n\n--- 2026-02-30 ---\n\n", today), /无效/);
assert.throws(() => notebook.parse("A\n\n--- 2026-99-99 ---\n\n", today), /无效/);
assert.throws(() => notebook.parse("A\n\n--- 2026-10-09 ---\n\nB\n\n--- 2026-10-09 ---", today), /重复/);
assert.throws(() => notebook.parse("历史分界线已被删掉", today, ["2026-10-09"]), /未覆盖/);
assert.deepEqual(notebook.parse("\n\n--- 2026-10-09 ---\n\n", today, ["2026-10-09"]), {});
assert.equal(notebook.serialize({ "2026-10-10": "   " }, today), "");
console.log("Inspiration notebook: original formatting, empty dates, midnight rollover, date attribution and marker protection passed");
