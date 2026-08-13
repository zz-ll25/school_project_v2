// server/coze-relay.js —— Coze 对话中转（零依赖 Node http，Node 18+）
// 前端（小程序 / 任意客户端）→ 本服务 → Coze Chat API（国内版 api.coze.cn）
// 能力：SSE 流式代理、主题护栏、令牌桶限流、无凭据本地兜底（复用小程序 data/ 数据源，零漂移）
const http = require("http");
const fs = require("fs");
const path = require("path");

// ---------- 配置 ----------
function loadEnv() {
  try {
    const txt = fs.readFileSync(path.join(__dirname, ".env"), "utf8");
    txt.split("\n").forEach((line) => {
      const m = line.match(/^\s*([\w]+)\s*=\s*(.*)\s*$/);
      if (m) process.env[m[1]] = m[2];
    });
  } catch (e) {
    /* .env 不存在则用环境变量 */
  }
}
loadEnv();

const PAT = process.env.COZE_PAT || "";
const BOT_ID = process.env.COZE_BOT_ID || "";
const BASE = process.env.COZE_BASE_URL || "https://api.coze.cn";
const USER_ID = process.env.COZE_USER_ID || "cduestc-miniapp";
const PORT = Number(process.env.PORT || 3000);

// 与小程序共用的数据源（data/ 为纯 CommonJS，可直接 require）
const kb = require("../data/kb.js");
const dataIndex = require("../data/index.js");

// ---------- 主题护栏 ----------
// 明显与「电子科技大学成都学院新生」无关的话题直接拦截，不调用 Coze、不消耗额度。
const OFF_TOPIC = [
  "北京大学", "清华大学", "复旦大学", "浙江大学", "上海交通大学", "南京大学", "武汉大学", "华中科技大学",
  "四川大学", "中山大学", "西安交通大学", "哈尔滨工业大学", "同济大学", "厦门大学", "天津大学", "中南大学",
  "重庆大学", "深圳大学", "暨南大学", "西南交通大学", "西南财经大学", "四川农业大学", "成都理工大学", "成都大学",
  "写代码", "编程", "python", "java", "c++", "c语言", "翻译", "股票", "炒股", "基金", "投资",
  "医疗", "诊断", "看病", "法律", "律师", "政治", "选举", "色情", "赌博", "怎么赚钱", "副业", "代写", "作业帮"
];
function isOffTopic(t) {
  const s = (t || "").toLowerCase();
  return OFF_TOPIC.some((w) => s.indexOf(w.toLowerCase()) >= 0);
}

// ---------- 限流（内存令牌桶） ----------
const buckets = new Map(); // key -> { tokens, ts }
function take(key, capacity, refillMs) {
  const now = Date.now();
  let b = buckets.get(key);
  if (!b) {
    b = { tokens: capacity, ts: now };
    buckets.set(key, b);
  }
  b.tokens = Math.min(capacity, b.tokens + (now - b.ts) / refillMs);
  b.ts = now;
  if (b.tokens < 1) return false;
  b.tokens -= 1;
  return true;
}
function rateLimited(ip, sid) {
  if (!take("ip:" + ip, 30, 1000)) return true;    // 每 IP：30 枚，1 枚/秒
  if (!take("sid:" + sid, 20, 30000)) return true; // 每会话：20 枚，1 枚/30 秒
  return false;
}
// 每 10 分钟清理空闲桶
setInterval(() => {
  const now = Date.now();
  buckets.forEach((b, k) => {
    if (now - b.ts > 10 * 60 * 1000) buckets.delete(k);
  });
}, 10 * 60 * 1000).unref();

// ---------- 会话映射 ----------
const sessions = new Map(); // sid -> conversation_id
function saveConv(sid, convId) {
  if (!convId) return;
  if (sessions.size >= 1000) {
    const first = sessions.keys().next().value;
    if (first !== undefined) sessions.delete(first);
  }
  sessions.set(sid, convId);
}

// ---------- 本地兜底（无凭据 / AI 异常时） ----------
function matchKb(text) {
  const t = (text || "").toLowerCase();
  for (let i = 0; i < kb.length; i++) {
    if (kb[i].q.some((k) => t.indexOf(k.toLowerCase()) >= 0)) return kb[i].a;
  }
  return null;
}

function renderItem(item) {
  const c = item.content || {};
  switch (item.type) {
    case "list":
      return (c.items || []).map((i) => "· " + i.text).join("\n");
    case "article":
      return (c.paragraphs || []).map((p) => (p.h ? p.h + "：" : "") + p.p).join("\n");
    case "notice":
      return (c.items || []).map((n) => "【" + n.title + "】" + n.body).join("\n");
    case "link":
      return (c.desc || "") + ((c.extra || []).map((e) => e.label + " " + e.tel).join("；") ? "\n" + (c.extra || []).map((e) => e.label + " " + e.tel).join("\n") : "");
    case "form":
      return (c.intro || "") + "（表单：" + (c.fields || []).map((f) => f.label).join("、") + "）";
    default:
      return item.summary || "";
  }
}

function mockAnswer(text) {
  const a = matchKb(text);
  if (a) return a;
  const hits = dataIndex.search(text);
  if (hits.length) {
    const top = hits[0];
    return "关于「" + top.item.title + "」：\n" + renderItem(top.item) + "\n\n（演示模式：未配置 Coze 凭据，这是本地数据兜底回答。）";
  }
  return "（演示模式）这个问题本地知识库没有覆盖。在 .env 填入 COZE_PAT 与 COZE_BOT_ID 后，我就能用 Coze 智能体真实回答啦。";
}

// ---------- 调用 Coze v3（流式） ----------
// 返回归一化 SSE：data: {"t":"d","c":...} / {"t":"end"} / {"t":"err","code","message"}
async function cozeChat(text, sid, { onDelta, onEnd, onErr }) {
  const body = {
    bot_id: BOT_ID,
    user_id: USER_ID,
    stream: true,
    auto_save_history: true,
    additional_messages: [{ role: "user", content: text, content_type: "text" }]
  };
  const convId = sessions.get(sid);
  if (convId) body.conversation_id = convId;

  const controller = new AbortController();
  // 看门狗：45 秒无新 chunk 中止
  let watchdog = setTimeout(() => {
    controller.abort();
    onErr("TIMEOUT", "回答超时，请稍后再试。");
    onEnd();
  }, 45000);

  const refresh = () => {
    clearTimeout(watchdog);
    watchdog = setTimeout(() => {
      controller.abort();
      onErr("TIMEOUT", "回答超时，请稍后再试。");
      onEnd();
    }, 45000);
  };

  try {
    const upstream = await fetch(BASE + "/v3/chat", {
      method: "POST",
      headers: { Authorization: "Bearer " + PAT, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal
    });

    if (!upstream.ok || !upstream.body) {
      let msg = "coze http " + upstream.status;
      try {
        const j = await upstream.json();
        msg = j.msg || j.message || msg;
      } catch (e) {}
      throw new Error(msg);
    }

    let buffer = "";
    let eventName = "";
    const decoder = new TextDecoder("utf-8");

    const processLine = (line) => {
      line = line.replace(/\r$/, "");
      if (line === "") { eventName = ""; return; }
      if (line.indexOf("event:") === 0) {
        eventName = line.slice(6).trim();
        return;
      }
      if (line.indexOf("data:") !== 0) return;
      const raw = line.slice(5).trim();
      if (!raw || raw === "[DONE]") return;
      let data;
      try { data = JSON.parse(raw); } catch (e) { return; }
      if (!data) return;

      if (eventName === "conversation.chat.created") {
        saveConv(sid, data.conversation_id || data.id);
      } else if (eventName === "conversation.message.delta") {
        if (data.type === "answer" && data.content) {
          refresh();
          onDelta(String(data.content));
        }
      } else if (eventName === "conversation.chat.completed") {
        onEnd();
      } else if (eventName === "conversation.chat.failed") {
        const e = (data.last_error && data.last_error.msg) || "coze chat failed";
        onErr("AI_ERROR", e);
        onEnd();
      }
    };

    for await (const chunk of upstream.body) {
      buffer += decoder.decode(chunk, { stream: true });
      let idx;
      while ((idx = buffer.indexOf("\n")) >= 0) {
        const line = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 1);
        processLine(line);
      }
    }
    if (buffer.trim()) processLine(buffer);
  } catch (e) {
    if (e.name === "AbortError") return; // 看门狗已处理
    onErr("AI_ERROR", String(e.message || e));
    onEnd();
  } finally {
    clearTimeout(watchdog);
  }
}

// ---------- 归一化 SSE 写出 ----------
function writeSSE(res, fn) {
  res.writeHead(200, {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type"
  });
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

function writeJson(res, code, obj) {
  res.writeHead(code, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type"
  });
  res.end(JSON.stringify(obj));
}

const ERR = {
  BAD_REQUEST: { code: "BAD_REQUEST", message: "消息格式不正确" },
  OFF_TOPIC: { code: "OFF_TOPIC", message: "我是成电新生助手，只回答电子科技大学成都学院的新生入学相关问题（报到 / 宿舍 / 选课 / 交通 / 一卡通 / 校园网等），其他话题可以请教其他 AI 哦～" },
  RATE_LIMITED: { code: "RATE_LIMITED", message: "提问太频繁啦，休息几秒再试吧" },
  AI_ERROR: { code: "AI_ERROR", message: "AI 服务暂时不可用，请稍后再试" }
};

// ---------- HTTP 服务 ----------
const server = http.createServer((req, res) => {
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type"
    });
    res.end();
    return;
  }

  if (req.url === "/health") {
    writeJson(res, 200, { ok: true, configured: !!(PAT && BOT_ID), ts: Date.now() });
    return;
  }

  if (req.url === "/api/chat" && req.method === "POST") {
    let body = "";
    req.on("data", (c) => {
      body += c;
      if (body.length > 10 * 1024) req.destroy(); // 请求体上限 10KB
    });
    req.on("end", () => {
      let message = "", sid = "default", stream = true;
      try {
        const o = JSON.parse(body || "{}");
        message = String(o.message || "").slice(0, 2000);
        sid = String(o.sessionId || "default").slice(0, 64);
        stream = o.stream !== false;
      } catch (e) {
        writeJson(res, 400, { error: ERR.BAD_REQUEST });
        return;
      }

      if (!message.trim()) {
        writeJson(res, 400, { error: ERR.BAD_REQUEST });
        return;
      }

      if (isOffTopic(message)) {
        writeJson(res, 200, { error: ERR.OFF_TOPIC });
        return;
      }

      const ip = (req.socket.remoteAddress || "").replace(/^::ffff:/, "");
      if (rateLimited(ip, sid)) {
        writeJson(res, 429, { error: ERR.RATE_LIMITED });
        return;
      }

      if (!(PAT && BOT_ID)) {
        // 无凭据：本地兜底（kb 优先，其次数据条目搜索）
        const answer = mockAnswer(message);
        if (stream) {
          writeSSE(res, (send, done) => {
            send({ t: "d", c: answer });
            send({ t: "end" });
            done();
          });
        } else {
          writeJson(res, 200, { answer: answer, sessionId: sid });
        }
        return;
      }

      if (stream) {
        writeSSE(res, (send, done) => {
          cozeChat(message, sid, {
            onDelta: (c) => send({ t: "d", c: c }),
            onEnd: () => { send({ t: "end" }); done(); },
            onErr: (code, msg) => send({ t: "err", code: code, message: msg })
          });
        });
      } else {
        // 非流式：仍以流式调 Coze，聚合后一次性返回
        let full = "";
        let err = null;
        cozeChat(message, sid, {
          onDelta: (c) => { full += c; },
          onEnd: () => {
            if (err) writeJson(res, 200, { error: err });
            else writeJson(res, 200, { answer: full || mockAnswer(message), sessionId: sid });
          },
          onErr: (code, msg) => { err = { code: code, message: msg }; }
        });
      }
    });
    return;
  }

  res.writeHead(404, { "Content-Type": "text/plain" });
  res.end("not found");
});

server.listen(PORT, () => {
  console.log("Coze relay listening on http://localhost:" + PORT);
  if (!(PAT && BOT_ID)) {
    console.log("[warn] 未检测到 COZE_PAT / COZE_BOT_ID，当前返回本地兜底回答（复用 data/ 数据源）。");
  }
});
