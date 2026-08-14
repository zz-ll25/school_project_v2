// src/routes/news.js —— 官网资讯：分页列表 / 分类过滤 / 详情（views+1）（公开）
const express = require("express");
const { pool } = require("../db/pool");
const { ok, fail } = require("../utils/envelope");

const router = express.Router();

// 列表：?category=&page=1&pageSize=10；置顶优先，同组按发布时间倒序
router.get("/news", async (req, res, next) => {
  try {
    const category = String(req.query.category || "").trim();
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const pageSize = Math.min(50, Math.max(1, parseInt(req.query.pageSize, 10) || 10));

    const where = category ? "WHERE category = ?" : "";
    const params = category ? [category] : [];

    const [countRows] = await pool.execute("SELECT COUNT(*) AS n FROM news " + where, params);
    const total = countRows[0].n;
    const offset = (page - 1) * pageSize;

    // LIMIT/OFFSET 内插：两值已 parseInt 强制为安全整数（mysql2 execute 字符串绑定不兼容 MySQL 预编译 LIMIT）
    const [rows] = await pool.execute(
      `SELECT id, title, category, summary, is_top, views, published_at
       FROM news ` + where + `
       ORDER BY is_top DESC, published_at DESC
       LIMIT ${pageSize} OFFSET ${offset}`,
      params
    );
    const list = rows.map((r) => ({
      id: r.id,
      title: r.title,
      category: r.category,
      summary: r.summary,
      isTop: !!r.is_top,
      views: r.views,
      publishedAt: r.published_at
    }));
    ok(res, { list: list, total: total, page: page, pageSize: pageSize, hasMore: offset + list.length < total });
  } catch (e) {
    next(e);
  }
});

// 详情（views+1）
router.get("/news/:id", async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id) return fail(res, 400, 40001, "参数错误");
    const [rows] = await pool.execute("SELECT * FROM news WHERE id = ?", [id]);
    if (!rows.length) return fail(res, 404, 40401, "资讯不存在");
    await pool.execute("UPDATE news SET views = views + 1 WHERE id = ?", [id]);
    const r = rows[0];
    ok(res, {
      id: r.id,
      title: r.title,
      category: r.category,
      summary: r.summary,
      content: r.content, // mysql2 已解析为对象数组
      isTop: !!r.is_top,
      views: r.views + 1,
      sourceUrl: r.source_url,
      publishedAt: r.published_at
    });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
