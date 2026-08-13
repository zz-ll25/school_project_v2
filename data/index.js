// data/index.js —— 数据聚合器与全文搜索（纯函数，Node 可直接 require 测试）
const school = require("./school.js");
const guide = require("./guide.js");
const services = require("./services.js");
const tour = require("./tour.js");

// 全部条目拼接（22 条）
function all() {
  return [].concat(guide, services, tour);
}

// 按 id 查条目（收藏/清单/申请均以 id 关联）
function byId(id) {
  const items = all();
  for (let i = 0; i < items.length; i++) {
    if (items[i].id === id) return items[i];
  }
  return null;
}

// 分组集合（搜索页分组渲染用）
function collections() {
  return [
    { key: "guide", label: "入学指南", items: guide },
    { key: "services", label: "校园服务", items: services },
    { key: "tour", label: "校园介绍", items: tour }
  ];
}

// ---- 搜索 ----

// 条目内容拍平成可搜索文本
function flattenContent(item) {
  const c = item.content || {};
  switch (item.type) {
    case "list":
      return (c.items || []).map(function (i) { return i.text; }).join(" ");
    case "article":
      return (c.paragraphs || []).map(function (p) { return (p.h || "") + " " + (p.p || ""); }).join(" ");
    case "notice":
      return (c.items || []).map(function (n) { return n.title + " " + n.body; }).join(" ");
    case "link":
      return [c.desc || "", c.tel || "", c.url || ""].concat(
        (c.extra || []).map(function (e) { return e.label + " " + e.tel; })
      ).join(" ");
    case "form":
      return (c.intro || "") + " " + (c.fields || []).map(function (f) { return f.label; }).join(" ");
    default:
      return "";
  }
}

// 构建小写 haystack：标题 + 摘要 + keywords + 正文
function haystack(item) {
  return [item.title, item.summary || ""].concat(item.keywords || []).concat(flattenContent(item))
    .join(" ")
    .toLowerCase();
}

// 打分：每个 term 在标题 +3、摘要/keywords +2、正文 +1
function score(item, terms) {
  const title = (item.title || "").toLowerCase();
  const sumkw = ((item.summary || "") + " " + (item.keywords || []).join(" ")).toLowerCase();
  let s = 0;
  terms.forEach(function (t) {
    if (title.indexOf(t) >= 0) s += 3;
    else if (sumkw.indexOf(t) >= 0) s += 2;
    else s += 1;
  });
  return s;
}

// 文本高亮分段：返回 [{t, hl}]，hl 段为命中 term 的区间（不区分大小写，合并重叠）
function segments(text, terms) {
  const t = text || "";
  const low = t.toLowerCase();
  const mask = new Array(t.length).fill(false);
  terms.forEach(function (term) {
    if (!term) return;
    let idx = low.indexOf(term);
    while (idx >= 0) {
      for (let i = idx; i < idx + term.length; i++) mask[i] = true;
      idx = low.indexOf(term, idx + term.length);
    }
  });
  const segs = [];
  let cur = { t: "", hl: false };
  for (let i = 0; i < t.length; i++) {
    if (mask[i] !== cur.hl && cur.t !== "") {
      segs.push(cur);
      cur = { t: "", hl: mask[i] };
    }
    cur.hl = mask[i];
    cur.t += t[i];
  }
  if (cur.t) segs.push(cur);
  return segs;
}

// 摘要窗口：截取首个命中位置 ±12 字，两端加省略号
function summarySegs(summary, terms) {
  const low = (summary || "").toLowerCase();
  let first = -1;
  terms.forEach(function (t) {
    const i = low.indexOf(t);
    if (i >= 0 && (first < 0 || i < first)) first = i;
  });
  if (first < 0) return [{ t: summary || "", hl: false }];
  const start = Math.max(0, first - 12);
  const end = Math.min(summary.length, first + 12);
  let sliced = summary.slice(start, end);
  if (start > 0) sliced = "…" + sliced;
  if (end < summary.length) sliced = sliced + "…";
  return segments(sliced, terms);
}

// 全文搜索：多词 AND 匹配，按分数降序（稳定排序，同分保持数据原序）
function search(q) {
  const terms = (q || "").toLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return [];
  const results = [];
  collections().forEach(function (col) {
    col.items.forEach(function (item) {
      const hay = haystack(item);
      const hit = terms.every(function (t) { return hay.indexOf(t) >= 0; });
      if (!hit) return;
      results.push({
        item: item,
        col: col.key,
        colLabel: col.label,
        score: score(item, terms),
        titleSegs: segments(item.title, terms),
        summarySegs: summarySegs(item.summary || "", terms)
      });
    });
  });
  results.sort(function (a, b) { return b.score - a.score; });
  return results;
}

module.exports = {
  school: school,
  guide: guide,
  services: services,
  tour: tour,
  all: all,
  byId: byId,
  collections: collections,
  search: search
};
