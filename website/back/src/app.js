// src/app.js —— Express 入口：中间件装配 → 路由挂载 → 错误兜底
const express = require("express");
const helmet = require("helmet");
const config = require("./config");
const { notFound, errorHandler } = require("./middleware/errors");

const app = express();

// ---------- 中间件 ----------
app.use(helmet()); // 安全响应头（论文安全素材）
app.use(express.json({ limit: "100kb" })); // 请求体上限

// 简易 CORS（开发期跨端口调试；上线走 Vite 同源 proxy 亦可保留）
app.use((req, res, next) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

// ---------- 路由 ----------
app.use("/api", require("./routes/health"));
app.use("/api", require("./routes/auth"));
app.use("/api", require("./routes/guide"));
app.use("/api", require("./routes/edu"));
app.use("/api", require("./routes/news"));
app.use("/api", require("./routes/favorites"));
app.use("/api", require("./routes/checklist"));
app.use("/api", require("./routes/applications"));
app.use("/api", require("./routes/chat"));

// ---------- 兜底 ----------
app.use(notFound);
app.use(errorHandler);

app.listen(config.port, () => {
  console.log("school-web back listening on http://127.0.0.1:" + config.port);
});
