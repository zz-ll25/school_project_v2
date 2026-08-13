// utils/share.js —— 分享能力统一封装
const APP_NAME = "电子科技大学成都学院 · 新生导航";

// 页面 onLoad 调用：开启分享（含朋友圈）
function shareMenuInit() {
  if (wx.showShareMenu) {
    wx.showShareMenu({ menus: ["shareAppMessage", "shareTimeline"] });
  }
}

// 生成 onShareAppMessage 返回值
function buildShare(title, path) {
  return {
    title: title || APP_NAME,
    path: path || "/pages/index/index"
  };
}

module.exports = { shareMenuInit: shareMenuInit, buildShare: buildShare, APP_NAME: APP_NAME };
