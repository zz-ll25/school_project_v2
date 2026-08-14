// src/routes/guide.js —— 新生导航：学校信息 / 分组集合 / 条目详情 / 全文搜索（公开）
const express = require("express");
const { ok, fail } = require("../utils/envelope");
const guideService = require("../services/guide");
const schoolData = require("../../../../data/school.js");

const router = express.Router();

// 列表页精简视图（不含 content，减少载荷）
function slim(item) {
  return {
    id: item.id,
    title: item.title,
    icon: item.icon,
    type: item.type,
    summary: item.summary,
    demo: item.demo,
    favoritable: item.favoritable
  };
}

// 学校基础信息（校区/坐标/电话）
router.get("/school", (req, res) => {
  ok(res, schoolData);
});

// 分组集合（列表页）
router.get("/guide/collections", async (req, res, next) => {
  try {
    const cols = await guideService.loadCollections();
    ok(res, {
      collections: cols.map((c) => ({ key: c.key, label: c.label, items: c.items.map(slim) }))
    });
  } catch (e) {
    next(e);
  }
});

// 全文搜索（q 为空返回空结果）—— 必须在 /guide/:itemId 之前注册，否则 "search" 会被当作 itemId
router.get("/guide/search", async (req, res, next) => {
  try {
    const q = String(req.query.q || "").trim();
    if (!q) return ok(res, { results: [] });
    ok(res, { results: await guideService.search(q) });
  } catch (e) {
    next(e);
  }
});

// 条目详情（完整 content）
router.get("/guide/:itemId", async (req, res, next) => {
  try {
    const item = await guideService.byId(req.params.itemId);
    if (!item) return fail(res, 404, 40401, "内容不存在");
    ok(res, { item: item });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
