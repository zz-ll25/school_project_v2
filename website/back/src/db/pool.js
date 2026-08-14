// src/db/pool.js —— mysql2 连接池（论文素材：连接复用、预编译语句）
const mysql = require("mysql2/promise");
const config = require("../config");

const pool = mysql.createPool({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
  connectionLimit: config.db.connectionLimit,
  charset: config.db.charset,
  waitForConnections: true,
  queueLimit: 0
});

// 健康检查：库未初始化时返回 false（/api/health 用）
async function ping() {
  try {
    await pool.query("SELECT 1");
    return true;
  } catch (e) {
    return false;
  }
}

module.exports = { pool: pool, ping: ping };
