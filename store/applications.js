// store/applications.js —— 表单申请记录（提交仅保存在本机，属演示数据）
const storage = require("./storage.js");

function rand() {
  return Math.random().toString(36).slice(2, 6);
}

// 新增一条申请。rec: { formId, formTitle, schemaVersion, values }
function add(rec) {
  const all = storage.get("applications", { list: [] });
  const item = Object.assign(
    { id: "ap_" + Date.now().toString(36) + "_" + rand(), submittedAt: Date.now() },
    rec
  );
  storage.set("applications", { list: [item].concat(all.list || []) });
  return item;
}

// 全部申请（新在前）
function list() {
  return storage.get("applications", { list: [] }).list || [];
}

function remove(id) {
  const items = list().filter(function (it) {
    return it.id !== id;
  });
  storage.set("applications", { list: items });
}

function count() {
  return list().length;
}

function pad(n) {
  return n < 10 ? "0" + n : "" + n;
}

// 时间戳 → "YYYY-MM-DD HH:mm"
function formatTime(ts) {
  const d = new Date(ts);
  return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) +
    " " + pad(d.getHours()) + ":" + pad(d.getMinutes());
}

module.exports = { add: add, list: list, remove: remove, count: count, formatTime: formatTime };
