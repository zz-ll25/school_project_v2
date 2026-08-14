// src/routes/applications.js —— 表单申请（需登录；后端按 schema + FORMAT_RULES 双重校验）
const express = require("express");
const crypto = require("crypto");
const { pool } = require("../db/pool");
const { ok, fail } = require("../utils/envelope");
const { validateForm } = require("../utils/format");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// 生成申请记录 id（规则沿用小程序 store/applications.js：ap_<ts36>_<rand>）
function newAppId() {
  return "ap_" + Date.now().toString(36) + "_" + crypto.randomBytes(3).toString("hex");
}

// 申请记录列表（新在前）
router.get("/applications", requireAuth, async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      "SELECT id, form_id, form_title, schema_version, values_json, submitted_at FROM applications WHERE student_no = ? ORDER BY submitted_at DESC",
      [req.student.studentNo]
    );
    const list = rows.map((r) => ({
      id: r.id,
      formId: r.form_id,
      formTitle: r.form_title,
      schemaVersion: r.schema_version,
      values: r.values_json, // mysql2 已解析 JSON
      submittedAt: r.submitted_at
    }));
    ok(res, { list: list });
  } catch (e) {
    next(e);
  }
});

// 提交申请：{ formId, values }
router.post("/applications", requireAuth, async (req, res, next) => {
  try {
    const body = req.body || {};
    const formId = String(body.formId || "");
    const values = body.values || {};
    if (!formId) return fail(res, 400, 40001, "参数错误");

    const [rows] = await pool.execute(
      "SELECT * FROM guide_items WHERE item_id = ? AND type = 'form'",
      [formId]
    );
    if (!rows.length) return fail(res, 404, 40401, "表单不存在");
    const form = rows[0];
    const fields = form.content; // mysql2 已解析 JSON 对象（form 类型 content 即 {intro, fields}）

    const r = validateForm(fields.fields || [], values);
    if (!r.ok) {
      return fail(res, 400, 40001, "表单校验失败：" + Object.values(r.errors)[0]);
    }

    const id = newAppId();
    await pool.execute(
      `INSERT INTO applications (id, student_no, form_id, form_title, schema_version, values_json, submitted_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [id, req.student.studentNo, formId, form.title, form.form_schema_version || 1, JSON.stringify(values)]
    );
    ok(res, {
      record: {
        id: id,
        formId: formId,
        formTitle: form.title,
        schemaVersion: form.form_schema_version || 1,
        values: values,
        submittedAt: new Date()
      }
    }, "提交成功");
  } catch (e) {
    next(e);
  }
});

// 删除申请记录
router.delete("/applications/:id", requireAuth, async (req, res, next) => {
  try {
    await pool.execute(
      "DELETE FROM applications WHERE id = ? AND student_no = ?",
      [req.params.id, req.student.studentNo]
    );
    ok(res, {});
  } catch (e) {
    next(e);
  }
});

// 清空我的交互数据（收藏/清单/申请）
router.delete("/user/data", requireAuth, async (req, res, next) => {
  try {
    const sid = req.student.studentNo;
    await pool.execute("DELETE FROM favorites WHERE student_no = ?", [sid]);
    await pool.execute("DELETE FROM checklist WHERE student_no = ?", [sid]);
    await pool.execute("DELETE FROM applications WHERE student_no = ?", [sid]);
    ok(res, {}, "已清空收藏、清单与申请记录");
  } catch (e) {
    next(e);
  }
});

module.exports = router;
