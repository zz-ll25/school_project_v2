// src/routes/favorites.js —— 收藏（需登录；UNIQUE(student_no, item_id) 幂等）
const express = require("express");
const { pool } = require("../db/pool");
const { ok, fail } = require("../utils/envelope");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// 收藏列表（JOIN 条目，新收藏在前）
router.get("/favorites", requireAuth, async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      `SELECT f.item_id, f.created_at, g.title, g.icon, g.type, g.summary, g.demo
       FROM favorites f JOIN guide_items g ON g.item_id = f.item_id
       WHERE f.student_no = ?
       ORDER BY f.created_at DESC`,
      [req.student.studentNo]
    );
    const items = rows.map((r) => ({
      itemId: r.item_id,
      title: r.title,
      icon: r.icon,
      type: r.type,
      summary: r.summary,
      demo: !!r.demo,
      favAt: r.created_at
    }));
    ok(res, { items: items });
  } catch (e) {
    next(e);
  }
});

// 收藏 id 列表（详情页收藏态）—— 必须在 /favorites/:itemId 之前注册
router.get("/favorites/ids", requireAuth, async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      "SELECT item_id FROM favorites WHERE student_no = ?",
      [req.student.studentNo]
    );
    ok(res, { ids: rows.map((r) => r.item_id) });
  } catch (e) {
    next(e);
  }
});

// 收藏（幂等）
router.post("/favorites/:itemId", requireAuth, async (req, res, next) => {
  try {
    const itemId = req.params.itemId;
    const [g] = await pool.execute("SELECT item_id FROM guide_items WHERE item_id = ?", [itemId]);
    if (!g.length) return fail(res, 404, 40401, "内容不存在");
    await pool.execute(
      "INSERT IGNORE INTO favorites (student_no, item_id) VALUES (?, ?)",
      [req.student.studentNo, itemId]
    );
    ok(res, { fav: true });
  } catch (e) {
    next(e);
  }
});

// 取消收藏
router.delete("/favorites/:itemId", requireAuth, async (req, res, next) => {
  try {
    await pool.execute(
      "DELETE FROM favorites WHERE student_no = ? AND item_id = ?",
      [req.student.studentNo, req.params.itemId]
    );
    ok(res, { fav: false });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
