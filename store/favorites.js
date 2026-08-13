// store/favorites.js —— 收藏（存条目 id 列表，新收藏在前）
const storage = require("./storage.js");

function list() {
  return storage.get("favorites", { ids: [] }).ids || [];
}

function isFav(id) {
  return list().indexOf(id) >= 0;
}

// 切换收藏状态，返回切换后是否已收藏
function toggle(id) {
  const ids = list();
  const i = ids.indexOf(id);
  if (i >= 0) {
    ids.splice(i, 1);
  } else {
    ids.unshift(id);
  }
  storage.set("favorites", { ids: ids });
  return i < 0;
}

function remove(id) {
  const ids = list();
  const i = ids.indexOf(id);
  if (i >= 0) {
    ids.splice(i, 1);
    storage.set("favorites", { ids: ids });
  }
}

function count() {
  return list().length;
}

module.exports = { list: list, isFav: isFav, toggle: toggle, remove: remove, count: count };
