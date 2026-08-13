// pages/favorites/favorites.js —— 我的收藏
const dataIndex = require("../../data/index.js");
const favorites = require("../../store/favorites.js");
const nav = require("../../utils/nav.js");
const share = require("../../utils/share.js");

Page({
  data: {
    items: []
  },

  onShow() {
    this.reload();
    share.shareMenuInit();
  },

  // 重载收藏列表；失效 id（数据中已不存在的条目）过滤并回写自愈
  reload() {
    const ids = favorites.list();
    const items = [];
    ids.forEach(function (id) {
      const item = dataIndex.byId(id);
      if (item) {
        items.push(item);
      } else {
        favorites.remove(id);
      }
    });
    this.setData({ items: items });
  },

  onItemTap(e) {
    nav.goDetail(e.currentTarget.dataset.id);
  },

  onRemove(e) {
    const id = e.currentTarget.dataset.id;
    favorites.remove(id);
    wx.showToast({ title: "已取消收藏", icon: "none" });
    this.reload();
  },

  onGoHome() {
    nav.goHome();
  },

  onShareAppMessage() {
    return share.buildShare("我的收藏");
  }
});
