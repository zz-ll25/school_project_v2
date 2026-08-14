// src/services/coze.js —— AI 对话服务（移植自 server/coze-relay.js，配合 MySQL 数据源）
// 能力：主题护栏 / 会话映射 / 本地知识库兜底（kb + 指南搜索）/ Coze v3 SSE 流式（45s 看门狗）
const config = require("../config");
const kb = require("../../../../data/kb.js");
const guideService = require("./guide");

// ---------- 主题护栏 ----------
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

// ---------- 会话映射（sid -> conversation_id） ----------
const sessions = new Map();
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
      return (c.desc || "") + ((c.extra || []).map((e) => e.label + " " + e.tel).join("；")
        ? "\n" + (c.extra || []).map((e) => e.label + " " + e.tel).join("\n") : "");
    case "form":
      return (c.intro || "") + "（表单：" + (c.fields || []).map((f) => f.label).join("、") + "）";
    default:
      return item.summary || "";
  }
}

// 兜底回答：kb 优先 → 指南条目搜索兜底（数据来自 MySQL guide_items）
async function mockAnswer(text) {
  const a = matchKb(text);
  if (a) return a;
  const hits = await guideService.search(text);
  if (hits.length) {
    const top = hits[0];
    return "关于「" + top.item.title + "」：\n" + renderItem(top.item) + "\n\n（演示模式：未配置 Coze 凭据，这是本地数据兜底回答。）";
  }
  return "（演示模式）这个问题本地知识库没有覆盖。配置 Coze 凭据后，我就能用 Coze 智能体真实回答啦。";
}

// ---------- 调用 Coze v3（流式） ----------
// 回调：onDelta(chunk) / onEnd() / onErr(code, message)；signal 用于外部中止
async function cozeChat(text, sid, { onDelta, onEnd, onErr, signal }) {
  const body = {
    bot_id: config.coze.botId,
    user_id: config.coze.userId,
    stream: true,
    auto_save_history: true,
    additional_messages: [{ role: "user", content: text, content_type: "text" }]
  };
  const convId = sessions.get(sid);
  if (convId) body.conversation_id = convId;

  const controller = new AbortController();
  // 外部中止（客户端断开）联动
  if (signal) {
    signal.addEventListener("abort", () => controller.abort());
  }

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
    const upstream = await fetch(config.coze.baseUrl + "/v3/chat", {
      method: "POST",
      headers: { Authorization: "Bearer " + config.coze.pat, "Content-Type": "application/json" },
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
    if (e.name === "AbortError") return; // 看门狗/外部中止已处理
    onErr("AI_ERROR", String(e.message || e));
    onEnd();
  } finally {
    clearTimeout(watchdog);
  }
}

module.exports = {
  isOffTopic: isOffTopic,
  mockAnswer: mockAnswer,
  cozeChat: cozeChat,
  aiConfigured: !!(config.coze.pat && config.coze.botId)
};
