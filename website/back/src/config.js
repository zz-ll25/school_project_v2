// src/config.js —— 环境配置加载（dotenv 读 back/.env，路径固定不受 cwd 影响）
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

module.exports = {
  port: Number(process.env.PORT || 8000),
  db: {
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "school_web",
    connectionLimit: 10,
    charset: "utf8mb4"
  },
  tokenTtlDays: Number(process.env.TOKEN_TTL_DAYS || 7),
  // 仅开发/自动化测试：验证码响应附带明文 code（生产必须为 0）
  debugCaptcha: Number(process.env.DEBUG_CAPTCHA || 0) === 1,
  coze: {
    pat: process.env.COZE_PAT || "",
    botId: process.env.COZE_BOT_ID || "",
    baseUrl: process.env.COZE_BASE_URL || "https://api.coze.cn",
    userId: process.env.COZE_USER_ID || "cduestc-web"
  }
};
