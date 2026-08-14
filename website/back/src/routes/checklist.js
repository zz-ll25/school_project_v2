// src/routes/checklist.js —— 清单勾选（需登录；UNIQUE(student_no, item_id, row_index)）
const express = require("express");
const { pool } = require("../db/pool");
const { ok, fail } = require("../utils/envelope");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// 某清单条目的勾选状态：{ map: {"0": true, ...}, doneCount }
router.get("/checklist/:itemId", requireAuth, async (req, res, next) => {
  try {
    const itemId = req.params.itemId;
    const [rows] = await pool.execute(
      "SELECT row_index, done FROM checklist WHERE student_no = ? AND item_id = ?",
      [req.student.studentNo, itemId]
    );
    const map = {};
    rows.forEach((r) => { map[r.row_index] = !!r.done; });
    ok(res, { map: map, doneCount: rows.filter((r) => r.done).length });
  } catch (e) {
    next(e);
  }
});

// 勾选/取消某行（upsert 幂等）
router.put("/checklist/:itemId/:rowIdx", requireAuth, async (req, res, next) => {
  try {
    const itemId = req.params.itemId;
    const rowIdx = parseInt(req.params.rowIdx, 10);
    const done = req.body && req.body.done ? 1 : 0;
    if (isNaN(rowIdx) || rowIdx < 0) return fail(res, 400, 40001, "参数错误");
    const [g] = await pool.execute("SELECT item_id FROM guide_items WHERE item_id = ? AND type = 'list'", [itemId]);
    if (!g.length) return fail(res, 404, 40401, "内容不存在或非清单类型");
    await pool.execute(
      `INSERT INTO checklist (student_no, item_id, row_index, done, updated_at)
       VALUES (?, ?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE done = VALUES(done), updated_at = NOW()`,
      [req.student.studentNo, itemId, rowIdx, done]
    );
    const [rows] = await pool.execute(
      "SELECT COUNT(*) AS n FROM checklist WHERE student_no = ? AND item_id = ? AND done = 1",
      [req.student.studentNo, itemId]
    );
    ok(res, { done: !!done, doneCount: rows[0].n });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
