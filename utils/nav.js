// utils/nav.js —— 统一跳转封装
function goDetail(id) {
  wx.navigateTo({ url: "/pages/detail/detail?id=" + encodeURIComponent(id) });
}

function goSearch() {
  wx.navigateTo({ url: "/pages/search/search" });
}

function goAssistant() {
  wx.navigateTo({ url: "/pages/assistant/assistant" });
}

function goFavorites() {
  wx.navigateTo({ url: "/pages/favorites/favorites" });
}

function goApplications() {
  wx.navigateTo({ url: "/pages/applications/applications" });
}

function goHome() {
  wx.switchTab({ url: "/pages/index/index" });
}

module.exports = {
  goDetail: goDetail,
  goSearch: goSearch,
  goAssistant: goAssistant,
  goFavorites: goFavorites,
  goApplications: goApplications,
  goHome: goHome
};
