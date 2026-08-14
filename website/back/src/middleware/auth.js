// src/middleware/auth.js —— 服务端 token 登录态（论文素材：可吊销、滑动续期）
// token：crypto.randomBytes(32).hex 入库 sessions；有效期 TOKEN_TTL_DAYS（默认 7 天）
// 滑动续期：剩余 < 3.5 天且距上次使用 > 1 小时 → 顺延 7 天（节流防写放大）
const crypto = require("crypto");
const { pool } = require("../db/pool");
const config = require("../config");
const { fail } = require("../utils/envelope");

const TTL_MS = config.tokenTtlDays * 24 * 3600 * 1000;
const RENEW_LEFT_MS = TTL_MS / 2;      // 剩余不足一半续期
const RENEW_MIN_GAP_MS = 3600 * 1000;  // 距上次使用 <1h 不写库

// 登录成功后签发：删除该生旧 token（单端登录）→ 插入新 token，事务保证
async function createToken(studentNo) {
  const token = crypto.randomBytes(32).toString("hex");
  const now = new Date();
  const expiresAt = new Date(now.getTime() + TTL_MS);
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.execute("DELETE FROM sessions WHERE student_no = ?", [studentNo]);
    await conn.execute(
      "INSERT INTO sessions (token, student_no, created_at, expires_at, last_used_at) VALUES (?, ?, ?, ?, ?)",
      [token, studentNo, now, expiresAt, now]
    );
    await conn.commit();
    return token;
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

async function deleteToken(token) {
  await pool.execute("DELETE FROM sessions WHERE token = ?", [token]);
}

// Bearer 认证中间件：校验 token → 挂载 req.student → 滑动续期
async function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.indexOf("Bearer ") === 0 ? header.slice(7).trim() : "";
  if (!token || token.length !== 64) {
    return fail(res, 401, 40101, "未登录或登录已失效");
  }
  try {
    const [rows] = await pool.execute(
      `SELECT s.student_no, s.name, s.major, s.class_name, s.grade,
              se.expires_at, se.last_used_at
       FROM sessions se JOIN students s ON s.student_no = se.student_no
       WHERE se.token = ?`,
      [token]
    );
    if (!rows.length) return fail(res, 401, 40101, "未登录或登录已失效");
    const row = rows[0];
    const now = new Date();
    if (new Date(row.expires_at) <= now) {
      await deleteToken(token);
      return fail(res, 401, 40101, "登录已过期，请重新登录");
    }

    // 滑动续期（节流）
    const remains = new Date(row.expires_at) - now;
    const gap = now - new Date(row.last_used_at);
    if (remains < RENEW_LEFT_MS && gap > RENEW_MIN_GAP_MS) {
      const newExp = new Date(now.getTime() + TTL_MS);
      await pool.execute("UPDATE sessions SET expires_at = ?, last_used_at = ? WHERE token = ?", [newExp, now, token]);
    }

    req.student = {
      studentNo: row.student_no,
      name: row.name,
      major: row.major,
      className: row.class_name,
      grade: row.grade
    };
    next();
  } catch (e) {
    next(e);
  }
}

module.exports = { createToken: createToken, deleteToken: deleteToken, requireAuth: requireAuth };
