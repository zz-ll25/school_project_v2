// src/routes/health.js —— 健康检查（公开）
const express = require("express");
const { ok } = require("../utils/envelope");
const { ping } = require("../db/pool");
const config = require("../config");

const router = express.Router();

router.get("/health", async (req, res) => {
  const db = await ping();
  ok(res, {
    db: db,
    aiConfigured: !!(config.coze.pat && config.coze.botId),
    ts: Date.now()
  });
});

module.exports = router;
