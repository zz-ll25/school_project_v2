// pages/assistant/assistant.js —— AI 新生助手
const chat = require("../../utils/chat.js");
const storage = require("../../store/storage.js");
const user = require("../../store/user.js");
const kb = require("../../data/kb.js");
const share = require("../../utils/share.js");

const GREETING = "你好呀，我是成电新生助手 🤖\n报到、宿舍、选课、交通、一卡通、社团……都可以问我～";
const DELTA_THROTTLE_MS = 80;

Page({
  data: {
    messages: [],
    input: "",
    sending: false,
    scrollInto: "",
    quick: []
  },

  onLoad() {
    this.sid = user.getSid();
    // 恢复聊天记录（sid 一致才恢复，清空对话后 sid 已变）
    const log = storage.get("chatlog", { sid: "", messages: [] });
    const messages =
      log.sid === this.sid && log.messages.length
        ? log.messages
        : [{ role: "assistant", text: GREETING }];
    this.setData({
      messages: messages,
      quick: kb.slice(0, 6).map(function (e) { return e.q[0]; }),
      scrollInto: "msg-" + (messages.length - 1)
    });
    share.shareMenuInit();
  },

  onInput(e) {
    this.setData({ input: e.detail.value });
  },

  // 发送 / 停止共用一个按钮
  onSendOrStop() {
    if (this.data.sending) {
      if (this.task) this.task.abort();
      return;
    }
    this.send();
  },

  send() {
    const text = (this.data.input || "").trim();
    if (!text || this.data.sending) return;

    const messages = this.data.messages.concat([{ role: "user", text: text }]);
    const botIndex = messages.length;
    messages.push({ role: "assistant", text: "" });
    this.setData({
      messages: messages,
      input: "",
      sending: true,
      scrollInto: "msg-" + botIndex
    });

    // 流式增量 setData 节流（80ms），最终文本以 onDone 为准
    let lastFlush = 0;
    const flushDelta = (shown) => {
      const now = Date.now();
      if (now - lastFlush < DELTA_THROTTLE_MS) return;
      lastFlush = now;
      this.setData({
        ["messages[" + botIndex + "].text"]: shown,
        scrollInto: "msg-" + botIndex
      });
    };

    this.task = chat.ask({
      message: text,
      sid: this.sid,
      onDelta: flushDelta,
      onDone: (full) => {
        this.setData({
          ["messages[" + botIndex + "].text"]: full,
          sending: false,
          scrollInto: "msg-" + botIndex
        });
        this.saveLog();
      }
    });
  },

  onChipTap(e) {
    if (this.data.sending) return;
    this.setData({ input: e.currentTarget.dataset.q });
    this.send();
  },

  onClear() {
    wx.showModal({
      title: "清空对话",
      content: "清空后对话历史将重置，确定吗？",
      success: (res) => {
        if (!res.confirm) return;
        if (this.task) this.task.abort();
        this.sid = user.resetSid();
        this.setData({
          messages: [{ role: "assistant", text: "对话已清空，还有什么想问的？" }],
          sending: false
        });
        this.saveLog();
      }
    });
  },

  // 持久化聊天记录（上限 100 条）
  saveLog() {
    storage.set("chatlog", { sid: this.sid, messages: this.data.messages.slice(-100) });
  },

  onShareAppMessage() {
    return share.buildShare("AI 新生助手");
  }
});
