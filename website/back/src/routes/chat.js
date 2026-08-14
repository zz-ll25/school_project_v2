// src/routes/chat.js —— AI 对话（SSE 流式）
// 协议：预检错误升级为 HTTP 码 + 统一信封（40001/42901）；
//       流内帧延续 coze-relay 归一化协议：{"t":"d","c":增量} / {"t":"end"} / {"t":"err",code,message}
const express = require("express");
const config = require("../config");
const { fail } = require("../utils/envelope");
const { limiter } = require("../middleware/rate-limit");
const { isOffTopic, mockAnswer, cozeChat } = require("../services/coze");

const router = express.Router();

// 限流：每 IP 30 枚 1 枚/秒；每会话 20 枚 1 枚/30 秒（沿用原 coze-relay 参数）
const ipLimit = limiter(30, 1000);
const sidLimit = limiter(20, 30 * 1000);

function clientIp(req) {
  return (req.headers["x-forwarded-for"] || req.socket.remoteAddress || "").toString().split(",")[0].trim();
}

// SSE 写出：writeHead + flushHeaders；客户端断开时中止上游
function writeSSE(res, fn) {
  res.writeHead(200, {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive"
  });
  res.flushHeaders();
  let ended = false;
  const send = (obj) => {
    if (ended) return;
    res.write("data: " + JSON.stringify(obj) + "\n\n");
  };
  const done = () => {
    if (ended) return;
    ended = true;
    res.end();
  };
  fn(send, done);
}

router.post("/chat", (req, res, next) => {
  try {
    const body = req.body || {};
    const message = String(body.message || "").slice(0, 2000);
    const sid = String(body.sessionId || "default").slice(0, 64);

    if (!message.trim()) return fail(res, 400, 40001, "消息不能为空");
    if (isOffTopic(message)) {
      return fail(res, 400, 40001, "我是成电校园助手，只回答电子科技大学成都学院的新生入学与校园相关问题（报到 / 宿舍 / 选课 / 交通 / 一卡通 / 校园网等），其他话题可以请教其他 AI 哦～");
    }
    const ip = clientIp(req);
    if (!ipLimit("chat:ip:" + ip) || !sidLimit("chat:sid:" + sid)) {
      return fail(res, 429, 42901, "提问太频繁啦，休息几秒再试吧");
    }

    writeSSE(res, (send, done) => {
      // 无凭据：本地兜底（kb 优先，其次指南条目搜索）
      if (!(config.coze.pat && config.coze.botId)) {
        mockAnswer(message)
          .then((answer) => {
            send({ t: "d", c: answer });
            send({ t: "end" });
            done();
          })
          .catch((e) => {
            send({ t: "err", code: "AI_ERROR", message: "AI 服务暂时不可用" });
            send({ t: "end" });
            done();
          });
        return;
      }

      const ctrl = new AbortController();
      // 客户端断开 → 中止上游 fetch，防泄漏
      req.on("close", () => {
        if (!res.writableEnded) ctrl.abort();
      });
      cozeChat(message, sid, {
        signal: ctrl.signal,
        onDelta: (c) => send({ t: "d", c: c }),
        onEnd: () => { send({ t: "end" }); done(); },
        onErr: (code, msg) => send({ t: "err", code: code, message: msg })
      });
    });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
