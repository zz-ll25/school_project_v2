// src/routes/auth.js —— 认证接口：验证码 / 登录 / 登出 / 当前用户
const express = require("express");
const { pool } = require("../db/pool");
const config = require("../config");
const { ok, fail } = require("../utils/envelope");
const { makeCaptcha, verifyCaptcha } = require("../utils/captcha");
const { verifyPassword } = require("../utils/password");
const { createToken, deleteToken, requireAuth } = require("../middleware/auth");
const { limiter } = require("../middleware/rate-limit");

const router = express.Router();

// 登录限流：每 IP 5 次/分钟；每学号 5 次/15 分钟（防爆破）
// DEBUG_CAPTCHA=1（仅开发/自动化测试）时容量放宽 ×10，生产参数不变
const limitScale = config.debugCaptcha ? 10 : 1;
const ipLimit = limiter(5 * limitScale, 60 * 1000);
const sidLimit = limiter(5 * limitScale, 15 * 60 * 1000);

function clientIp(req) {
  return (req.headers["x-forwarded-for"] || req.socket.remoteAddress || "").toString().split(",")[0].trim();
}

// 获取图形验证码（DEBUG_CAPTCHA=1 时 data 附带明文 code，仅开发用）
router.post("/auth/captcha", (req, res) => {
  const cap = makeCaptcha();
  const data = { captchaId: cap.captchaId, image: cap.image };
  if (config.debugCaptcha) data.code = cap.code;
  ok(res, data);
});

// 学号 + 密码 + 验证码登录
router.post("/auth/login", async (req, res, next) => {
  try {
    const body = req.body || {};
    const studentNo = String(body.studentNo || "").trim();
    const password = String(body.password || "");
    const captchaId = String(body.captchaId || "");
    const captchaCode = String(body.captchaCode || "").trim();

    if (!/^\d{6,12}$/.test(studentNo) || !password || !captchaId || !captchaCode) {
      return fail(res, 400, 40001, "参数缺失或格式错误");
    }

    // 限流（验证码与密码错误均计数）
    const ip = clientIp(req);
    if (!ipLimit("login:ip:" + ip) || !sidLimit("login:sid:" + studentNo)) {
      return fail(res, 429, 42901, "尝试过于频繁，请稍后再试");
    }

    // 验证码（成功即删，一次性；错满 5 次作废）
    if (!verifyCaptcha(captchaId, captchaCode)) {
      return fail(res, 401, 40103, "验证码错误或已过期");
    }

    // 学号 + 密码（scrypt 慢哈希比对）
    const [rows] = await pool.execute("SELECT * FROM students WHERE student_no = ?", [studentNo]);
    if (!rows.length || !verifyPassword(password, rows[0].password_hash)) {
      return fail(res, 401, 40102, "学号或密码错误");
    }

    const st = rows[0];
    const token = await createToken(studentNo);
    ok(res, {
      token: token,
      student: {
        studentNo: st.student_no,
        name: st.name,
        major: st.major,
        className: st.class_name,
        grade: st.grade
      }
    }, "登录成功");
  } catch (e) {
    next(e);
  }
});

// 登出：删除 token 行（服务端可吊销）
router.post("/auth/logout", requireAuth, async (req, res, next) => {
  try {
    const token = String(req.headers.authorization || "").slice(7).trim();
    await deleteToken(token);
    ok(res, {}, "已退出登录");
  } catch (e) {
    next(e);
  }
});

// 当前登录学生信息
router.get("/auth/me", requireAuth, (req, res) => {
  ok(res, req.student);
});

module.exports = router;
