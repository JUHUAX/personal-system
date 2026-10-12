(function defineNotebook(root) {
  "use strict";
  const marker = /^--- (\d{4}-\d{2}-\d{2}) ---$/gm;
  function validDate(value) {
    const date = new Date(`${value}T12:00:00Z`);
    return /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(date.getTime()) &&
      date.toISOString().slice(0, 10) === value;
  }
  function serialize(entries, currentDate) {
    const closed = Object.keys(entries).filter((date) => date !== currentDate &&
      validDate(date) && String(entries[date] || "").trim()).sort();
    const history = closed.map((date) => `${entries[date]}\n\n--- ${date} ---\n\n`).join("");
    return history + (String(entries[currentDate] || "").trim() ? entries[currentDate] : "");
  }
  function parse(text, currentDate, requiredDates = []) {
    // Date footers close the preceding text; the unclosed tail belongs to today.
    if (!validDate(currentDate)) throw new Error("灵感日期无效。");
    const entries = {}, seen = new Set();
    let offset = 0;
    for (const match of String(text).matchAll(marker)) {
      const date = match[1];
      if (!validDate(date) || seen.has(date)) throw new Error("灵感分界线的日期无效或重复。");
      seen.add(date);
      const body = text.slice(offset, match.index).replace(/\n\n$/, "");
      if (body.trim()) entries[date] = body;
      offset = match.index + match[0].length;
      if (text.slice(offset, offset + 2) === "\n\n") offset += 2;
    }
    if (requiredDates.some((date) => date !== currentDate && !seen.has(date)))
      throw new Error("历史灵感的日期分界线缺失，本次未覆盖记录。");
    const tail = text.slice(offset);
    if (tail.trim()) {
      if (seen.has(currentDate)) throw new Error("今天的灵感日期重复。");
      entries[currentDate] = tail;
    }
    return entries;
  }
  function rollover(text, previousDate, currentDate) {
    return previousDate === currentDate ? text : serialize(parse(text, previousDate), currentDate);
  }
  const api = Object.freeze({ serialize, parse, rollover });
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.InspirationNotebook = api;
})(globalThis);
