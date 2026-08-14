// scripts/db-init.js —— 一键初始化：建库（utf8mb4）→ 执行 schema.sql → 写入种子数据
// 幂等：DROP DATABASE IF EXISTS 重建，可随时重跑复位演示数据（npm run db:init）
const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");
const config = require("../src/config");
const seed = require("./gen-seed");

async function main() {
  // 1. 连接服务器（不指定库）→ 重建数据库
  const conn = await mysql.createConnection({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    charset: config.db.charset
  });
  console.log("==> drop & create database:", config.db.database);
  await conn.query("DROP DATABASE IF EXISTS `" + config.db.database + "`");
  await conn.query(
    "CREATE DATABASE `" + config.db.database + "` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
  );
  await conn.end();

  // 2. 连接目标库 → 执行 schema.sql
  const pool = mysql.createPool({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    database: config.db.database,
    charset: config.db.charset,
    multipleStatements: true
  });
  const schema = fs.readFileSync(path.join(__dirname, "../db/schema.sql"), "utf8");
  console.log("==> apply db/schema.sql");
  await pool.query(schema);

  // 3. 种子数据
  console.log("==> seed data");
  const counts = await seed.run(pool);
  console.log("==> done:", JSON.stringify(counts, null, 2));
  await pool.end();
}

main().catch((e) => {
  console.error("db-init failed:", e.message);
  process.exit(1);
});
