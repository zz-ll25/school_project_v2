// store/storage.js —— 本地存储底层封装
// 约定：所有业务 key 带前缀 cduestc:，写入值统一包裹 { v: VERSION, ...value }。
// 读取时 JSON 损坏或版本不符 → 返回默认值并覆盖写回（损坏自愈）。
const PREFIX = "cduestc:";
const VERSION = 1;

function fullKey(key) {
  return PREFIX + key;
}

// 读取。def 为不含 v 的业务默认值；返回对象（不包含 v 字段）。
function get(key, def) {
  try {
    const raw = wx.getStorageSync(fullKey(key));
    if (raw === "" || raw === null || raw === undefined) return def;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.v === VERSION) {
      const copy = Object.assign({}, parsed);
      delete copy.v;
      return Object.assign({}, def, copy);
    }
  } catch (e) {
    // 解析失败 → 落入自愈分支
  }
  set(key, def);
  return def;
}

// 写入。自动包裹 v 版本号。
function set(key, value) {
  try {
    wx.setStorageSync(fullKey(key), JSON.stringify(Object.assign({ v: VERSION }, value)));
  } catch (e) {
    // 存储满等异常静默忽略，业务层以默认值继续
  }
}

function remove(key) {
  try {
    wx.removeStorageSync(fullKey(key));
  } catch (e) {}
}

// 清空全部业务数据（只删 cduestc:* 前缀，不动系统 key）
function clearAll() {
  try {
    const info = wx.getStorageInfoSync();
    (info.keys || []).forEach(function (k) {
      if (k.indexOf(PREFIX) === 0) wx.removeStorageSync(k);
    });
  } catch (e) {}
}

module.exports = { get: get, set: set, remove: remove, clearAll: clearAll };
