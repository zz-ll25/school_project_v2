// store/checklist.js —— 清单勾选状态（数据条目里不存 done，状态只在这里）
// 结构：{ itemId: { "行索引": true } }
const storage = require("./storage.js");

function getMap(itemId) {
  const all = storage.get("checklist", { data: {} });
  return (all.data && all.data[itemId]) || {};
}

// 切换某行勾选，返回该条目最新勾选 map
function toggle(itemId, idx) {
  const all = storage.get("checklist", { data: {} });
  const data = all.data || {};
  const m = data[itemId] || {};
  m[idx] = !m[idx];
  data[itemId] = m;
  storage.set("checklist", { data: data });
  return m;
}

function doneCount(itemId) {
  const m = getMap(itemId);
  let n = 0;
  Object.keys(m).forEach(function (k) {
    if (m[k]) n++;
  });
  return n;
}

module.exports = { getMap: getMap, toggle: toggle, doneCount: doneCount };
