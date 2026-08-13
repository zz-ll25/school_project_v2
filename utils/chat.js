// utils/chat.js —— AI 助手客户端
// 三级策略：
//   1) 服务端可达且支持分块 → SSE 流式（wx.request enableChunked + onChunkReceived）
//   2) 不支持分块 → 一次性请求（stream:false，服务端返回完整 answer）
//   3) 服务端不可达 / AI 异常 → 本地知识库（data/kb.js）兜底 + 打字机效果
// 服务端归一化协议（JSON 行）：{"t":"d","c":"增量"} / {"t":"end"} / {"t":"err","code","message"}
const kb = require("../data/kb.js");

const RELAY_BASE = "http://localhost:3000"; // 本地调试；上线改 HTTPS 合法域名
const USE_SERVER = true;                    // false 时跳过服务端，纯本地兜底

const DEFAULT_REPLY = "这个问题我暂时答不上来～建议查看「新生必看」里的相关条目，或拨打「学校电话」中的电话咨询。";
const FALLBACK_MESSAGES = {
  AI_ERROR: "AI 服务暂时不可用，请稍后再试。",
  TIMEOUT: "回答超时了，换个问法或稍后再试。"
};

// 本地知识库匹配（任一关键词命中），未命中返回 null
function matchLocal(text) {
  const t = (text || "").toLowerCase();
  for (let i = 0; i < kb.length; i++) {
    if (kb[i].q.some(function (k) { return t.indexOf(k.toLowerCase()) >= 0; })) {
      return kb[i].a;
    }
  }
  return null;
}

// 纯 JS UTF-8 解码（完整行的字节，避免依赖 TextDecoder 兼容性）
function utf8Decode(bytes) {
  let out = "";
  let i = 0;
  while (i < bytes.length) {
    const b = bytes[i];
    let cp;
    let extra;
    if (b < 0x80) { cp = b; extra = 0; }
    else if ((b & 0xE0) === 0xC0) { cp = b & 0x1F; extra = 1; }
    else if ((b & 0xF0) === 0xE0) { cp = b & 0x0F; extra = 2; }
    else if ((b & 0xF8) === 0xF0) { cp = b & 0x07; extra = 3; }
    else { cp = 0xFFFD; extra = 0; }
    i++;
    if (i + extra > bytes.length) break;
    for (let j = 0; j < extra; j++) cp = (cp << 6) | (bytes[i + j] & 0x3F);
    i += extra;
    out += String.fromCodePoint(cp);
  }
  return out;
}

// 是否支持分块接收
function canChunk() {
  try {
    return !!(wx.canIUse && wx.canIUse("RequestTask.onChunkReceived") && wx.canIUse("request.enableChunked"));
  } catch (e) {
    return false;
  }
}

// 打字机：本地兜底 / 一次性结果逐字展示。停止时保留已显示部分。
function typing(text, onDelta, settle, task) {
  let shown = "";
  const step = Math.max(1, Math.ceil(text.length / 24));
  let i = 0;
  const timer = setInterval(function () {
    i += step;
    shown = text.slice(0, i);
    if (onDelta) onDelta(shown);
    if (i >= text.length) {
      clearInterval(timer);
      settle(text);
    }
  }, 30);
  task._abort = function () {
    clearInterval(timer);
    task.aborted = true;
    settle(shown);
  };
}

// 发起提问。opts: { message, sid, onDelta(全文), onDone(最终文本) }
// 返回 { abort } —— 停止后最终文本带「（已停止）」后缀
function ask(opts) {
  const message = opts.message;
  const sid = opts.sid;
  const onDelta = opts.onDelta;
  const onDone = opts.onDone;

  const task = { aborted: false, _abort: null };
  let full = "";
  let settled = false;

  const settle = function (text) {
    if (settled) return;
    settled = true;
    onDone((text || "") + (task.aborted ? "（已停止）" : ""));
  };

  // 服务端异常（AI_ERROR/TIMEOUT）或不可达 → 本地兜底
  const localFallback = function (errCode) {
    const a = matchLocal(message);
    if (a) {
      typing(a, onDelta, settle, task);
      return;
    }
    settle(errCode ? (FALLBACK_MESSAGES[errCode] || FALLBACK_MESSAGES.AI_ERROR) : DEFAULT_REPLY);
  };

  const handleServerError = function (e) {
    if (e.code === "OFF_TOPIC" || e.code === "RATE_LIMITED" || e.code === "BAD_REQUEST") {
      settle(e.message);
      return;
    }
    localFallback(e.code);
  };

  if (!USE_SERVER) {
    localFallback(null);
    return { abort: function () { task.aborted = true; if (task._abort) task._abort(); } };
  }

  if (canChunk()) {
    // 分块流式
    let buf = null;
    const feedBytes = function (ab) {
      const bytes = new Uint8Array(ab);
      if (!buf) buf = bytes;
      else {
        const n = new Uint8Array(buf.length + bytes.length);
        n.set(buf);
        n.set(bytes, buf.length);
        buf = n;
      }
    };
    const nextLine = function () {
      if (!buf) return null;
      let idx = -1;
      for (let i = 0; i < buf.length; i++) {
        if (buf[i] === 0x0A) { idx = i; break; }
      }
      if (idx < 0) return null;
      const lineBytes = buf.subarray(0, idx);
      buf = buf.subarray(idx + 1);
      return utf8Decode(lineBytes).trim();
    };
    const handleLine = function (line) {
      if (!line || line.indexOf("data:") !== 0) return;
      let evt;
      try {
        evt = JSON.parse(line.slice(5).trim());
      } catch (e) {
        return;
      }
      if (!evt) return;
      if (evt.t === "d") {
        full += evt.c || "";
        onDelta(full);
      } else if (evt.t === "err") {
        handleServerError({ code: evt.code, message: evt.message });
      } else if (evt.t === "end") {
        settle(full);
      }
    };

    const req = wx.request({
      url: RELAY_BASE + "/api/chat",
      method: "POST",
      data: { message: message, sessionId: sid, stream: true },
      enableChunked: true,
      timeout: 60000,
      success: function (res) {
        const d = res.data || {};
        if (d.error) { handleServerError(d.error); return; }
        if (d.answer) {
          full = d.answer;
          settle(full);
        } else if (!full) {
          settle(DEFAULT_REPLY);
        }
      },
      fail: function () {
        if (task.aborted) { settle(full); return; }
        localFallback(null);
      }
    });
    task._abort = function () { req.abort(); };
    req.onChunkReceived(function (res) {
      feedBytes(res.data);
      let line;
      while ((line = nextLine()) !== null) handleLine(line);
    });
  } else {
    // 一次性降级
    const req = wx.request({
      url: RELAY_BASE + "/api/chat",
      method: "POST",
      data: { message: message, sessionId: sid, stream: false },
      timeout: 30000,
      success: function (res) {
        const d = res.data || {};
        if (d.error) { handleServerError(d.error); return; }
        const text = d.answer || "";
        typing(text, onDelta, settle, task);
      },
      fail: function () {
        if (task.aborted) { settle(full); return; }
        localFallback(null);
      }
    });
    task._abort = function () { req.abort(); };
  }

  return {
    abort: function () {
      task.aborted = true;
      if (task._abort) task._abort();
    }
  };
}

module.exports = { ask: ask, matchLocal: matchLocal, canChunk: canChunk, RELAY_BASE: RELAY_BASE };
