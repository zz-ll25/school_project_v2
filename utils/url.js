// utils/url.js —— 外链 / 拨号 / 地图
function callPhone(tel) {
  wx.makePhoneCall({
    phoneNumber: String(tel),
    fail: function () {}
  });
}

// 小程序 web-view 需配置业务域名，为避免演示阻塞，外链统一复制到剪贴板并提示
function copyLink(url) {
  wx.setClipboardData({
    data: String(url),
    success: function () {
      wx.showToast({ title: "链接已复制，去浏览器打开", icon: "none" });
    }
  });
}

// 打开微信内置地图（campus: { name, addr, latitude, longitude }）
function openCampus(campus) {
  if (!campus || !campus.latitude || !campus.longitude) {
    wx.showToast({ title: "地图坐标暂未配置", icon: "none" });
    return;
  }
  wx.openLocation({
    latitude: campus.latitude,
    longitude: campus.longitude,
    name: campus.name,
    address: campus.addr,
    scale: 16,
    fail: function () {
      wx.showToast({ title: "地图打开失败", icon: "none" });
    }
  });
}

module.exports = { callPhone: callPhone, copyLink: copyLink, openCampus: openCampus };
