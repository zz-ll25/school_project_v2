// src/services/guide.js —— 指南内容服务：MySQL 载入 + 全文搜索
// 搜索算法移植自 data/index.js（打分：标题 +3 / 摘要关键词 +2 / 正文 +1；多词 AND；高亮分段），
// 数据量 22 条，采用全量内存索引（论文素材：中文分词需 ngram 解析器，自研关键词打分更可控）
const { pool } = require("../db/pool");

const COLLECTION_LABELS = { guide: "入学指南", services: "校园服务", tour: "校园介绍" };

// ---------- 内存缓存 ----------
let collectionsCache = null; // [{key, label, items:[完整条目]}]

// mysql2 对 JSON 列已自动解析为对象/数组；兼容字符串形态兜底
function safeJson(v) {
  if (v == null) return null;
  if (typeof v === "string") {
    try { return JSON.parse(v); } catch (e) { return null; }
  }
  return v;
}

function dbRowToItem(row) {
  return {
    id: row.item_id,
    title: row.title,
    icon: row.icon,
    type: row.type,
    summary: row.summary,
    keywords: safeJson(row.keywords) || [],
    content: safeJson(row.content) || {},
    favoritable: !!row.favoritable,
    demo: !!row.demo,
    formSchemaVersion: row.form_schema_version || null
  };
}

// 载入全部条目并按 category 分组（惰性 + 缓存）
async function loadCollections() {
  if (collectionsCache) return collectionsCache;
  const [rows] = await pool.execute("SELECT * FROM guide_items ORDER BY sort_order");
  const byCat = {};
  rows.forEach((row) => {
    const cat = row.category;
    if (!byCat[cat]) byCat[cat] = [];
    byCat[cat].push(dbRowToItem(row));
  });
  collectionsCache = Object.keys(COLLECTION_LABELS).map((key) => ({
    key: key,
    label: COLLECTION_LABELS[key],
    items: byCat[key] || []
  }));
  return collectionsCache;
}

// ---------- 搜索（算法与 data/index.js 一致） ----------

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

function haystack(item) {
  return [item.title, item.summary || ""].concat(item.keywords || []).concat(flattenContent(item))
    .join(" ")
    .toLowerCase();
}

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
async function search(q) {
  const terms = (q || "").toLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return [];
  const collections = await loadCollections();
  const results = [];
  collections.forEach(function (col) {
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

// 按 id 查条目
async function byId(id) {
  const collections = await loadCollections();
  for (const col of collections) {
    for (const item of col.items) {
      if (item.id === id) return item;
    }
  }
  return null;
}

module.exports = { loadCollections: loadCollections, search: search, byId: byId };
