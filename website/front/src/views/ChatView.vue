<template>
  <div class="page chat-wrap">
    <div class="ui-card chat-card">
      <div class="chat-head">
        <div class="chat-title">🤖 校园 AI 助手</div>
        <el-button text size="small" @click="onClear">清空对话</el-button>
      </div>

      <div ref="listRef" class="chat-list">
        <div v-if="!messages.length" class="chat-welcome">
          <div class="welcome-icon">🤖</div>
          <div class="welcome-title">你好！我是成电校园助手</div>
          <div class="welcome-sub">报到、宿舍、选课、交通、一卡通……校园问题都可以问我</div>
          <div class="chips">
            <span v-for="c in chips" :key="c" class="chip" @click="send(c)">{{ c }}</span>
          </div>
        </div>

        <div v-for="(m, i) in messages" :key="i" class="msg" :class="m.role === 'user' ? 'msg-user' : 'msg-bot'">
          <div class="msg-bubble">{{ m.text }}</div>
        </div>

        <div v-if="streaming" class="msg msg-bot">
          <div class="msg-bubble typing-bubble"><span class="dot" /><span class="dot" /><span class="dot" /></div>
        </div>
      </div>

      <div class="chat-input">
        <el-input v-model="input" placeholder="输入问题，回车发送" maxlength="500"
          :disabled="streaming" @keyup.enter="send()">
          <template #append>
            <el-button v-if="!streaming" type="primary" :disabled="!input.trim()" @click="send()">发送</el-button>
            <el-button v-else type="danger" @click="stop()">停止</el-button>
          </template>
        </el-input>
        <div class="chat-tip">演示模式：未配置 Coze 凭据时由本地知识库回答</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { nextTick, onMounted, ref } from "vue";
import { ElMessage } from "element-plus";

const chips = ["报到流程", "宿舍条件", "如何选课", "快递地址"];

const messages = ref([]);
const input = ref("");
const streaming = ref(false);
const listRef = ref(null);

let abortCtrl = null;

// 会话 sid（持久化，延续多轮对话）
function getSid() {
  let sid = "";
  try { sid = localStorage.getItem("cduestc-web:sid") || ""; } catch (e) {}
  if (!sid) {
    sid = "s_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 6);
    try { localStorage.setItem("cduestc-web:sid", sid); } catch (e) {}
  }
  return sid;
}

function scrollToBottom() {
  nextTick(() => {
    if (listRef.value) listRef.value.scrollTop = listRef.value.scrollHeight;
  });
}

// 逐行解析 SSE 帧：data: {"t":"d","c":...} / {"t":"end"} / {"t":"err",...}
function handleLine(line, botMsg) {
  if (line.indexOf("data:") !== 0) return;
  let evt;
  try {
    evt = JSON.parse(line.slice(5).trim());
  } catch (e) {
    return;
  }
  if (!evt) return;
  if (evt.t === "d") {
    botMsg.text += evt.c || "";
    scrollToBottom();
  } else if (evt.t === "err") {
    botMsg.text += "\n\n[" + (evt.code || "ERROR") + "] " + (evt.message || "服务异常");
  } else if (evt.t === "end") {
    if (!botMsg.text.trim()) botMsg.text = "（无回复）";
  }
}

async function send(text) {
  const q = (text || input.value).trim();
  if (!q || streaming.value) return;
  input.value = "";
  messages.value.push({ role: "user", text: q });
  const botMsg = { role: "assistant", text: "" };
  messages.value.push(botMsg);
  streaming.value = true;
  abortCtrl = new AbortController();
  scrollToBottom();

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: q, sessionId: getSid(), stream: true }),
      signal: abortCtrl.signal
    });

    // 预检错误（护栏/限流/参数）：HTTP 非 200 且返回信封 JSON
    if (!res.ok || (res.headers.get("content-type") || "").indexOf("text/event-stream") < 0) {
      let j = null;
      try { j = await res.json(); } catch (e) {}
      botMsg.text = (j && j.message) || "AI 服务暂时不可用";
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let idx;
      while ((idx = buffer.indexOf("\n")) >= 0) {
        const line = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 1);
        handleLine(line, botMsg);
      }
    }
  } catch (e) {
    if (e.name === "AbortError") return; // 用户停止
    botMsg.text = botMsg.text || "网络异常，请稍后再试";
  } finally {
    streaming.value = false;
    abortCtrl = null;
    scrollToBottom();
  }
}

function stop() {
  if (abortCtrl) abortCtrl.abort();
}

function onClear() {
  messages.value = [];
  try { localStorage.removeItem("cduestc-web:sid"); } catch (e) {}
  ElMessage.success("对话已清空");
}

onMounted(() => {});
</script>

<style scoped>
.chat-wrap {
  max-width: 860px;
  height: calc(100vh - 140px);
  min-height: 480px;
}
.chat-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 0;
  overflow: hidden;
}
.chat-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 20px;
  border-bottom: 1px solid #f0e8de;
}
.chat-title {
  font-weight: 700;
}
.chat-list {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}
.chat-welcome {
  text-align: center;
  padding-top: 48px;
}
.welcome-icon {
  font-size: 44px;
}
.welcome-title {
  font-size: 18px;
  font-weight: 700;
  margin-top: 10px;
}
.welcome-sub {
  font-size: 13px;
  color: var(--text-sub);
  margin-top: 6px;
}
.chips {
  margin-top: 20px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
}
.chip {
  font-size: 13px;
  padding: 6px 14px;
  border: 1px solid var(--el-color-primary-light-5);
  color: var(--el-color-primary);
  border-radius: 16px;
  cursor: pointer;
  background: #fff;
}
.chip:hover {
  background: var(--el-color-primary-light-9);
}
.msg {
  display: flex;
  margin-bottom: 14px;
}
.msg-user {
  justify-content: flex-end;
}
.msg-user .msg-bubble {
  background: var(--el-color-primary);
  color: #fff;
  border-radius: 12px 12px 2px 12px;
}
.msg-bot .msg-bubble {
  background: #f6f1ea;
  border-radius: 12px 12px 12px 2px;
}
.msg-bubble {
  max-width: 76%;
  padding: 10px 14px;
  font-size: 14px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}
.typing-bubble {
  display: flex;
  gap: 4px;
  align-items: center;
  padding: 14px 16px;
}
.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #c9beb2;
  animation: blink 1.2s infinite;
}
.dot:nth-child(2) { animation-delay: 0.2s; }
.dot:nth-child(3) { animation-delay: 0.4s; }
@keyframes blink {
  0%, 80%, 100% { opacity: 0.3; }
  40% { opacity: 1; }
}
.chat-input {
  padding: 14px 20px;
  border-top: 1px solid #f0e8de;
}
.chat-tip {
  font-size: 12px;
  color: #b3a89c;
  margin-top: 8px;
  text-align: center;
}
</style>
