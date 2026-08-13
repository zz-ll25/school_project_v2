// store/user.js —— 每设备会话标识（AI 助手多轮对话用）
const storage = require("./storage.js");

function rand4() {
  return Math.random().toString(36).slice(2, 6);
}

function newSid() {
  return "s_" + Date.now().toString(36) + "_" + rand4();
}

// 取当前 sid，不存在则生成并持久化
function getSid() {
  const u = storage.get("user", {});
  if (!u.sid) {
    u.sid = newSid();
    u.createdAt = Date.now();
    storage.set("user", u);
  }
  return u.sid;
}

// 重置 sid（清空对话 = 服务端新会话），返回新 sid
function resetSid() {
  const u = { sid: newSid(), createdAt: Date.now() };
  storage.set("user", u);
  return u.sid;
}

module.exports = { getSid: getSid, resetSid: resetSid };
