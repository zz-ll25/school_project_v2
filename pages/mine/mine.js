// pages/mine/mine.js —— 我的
const school = require("../../data/school.js");
const favorites = require("../../store/favorites.js");
const applications = require("../../store/applications.js");
const storage = require("../../store/storage.js");
const user = require("../../store/user.js");
const nav = require("../../utils/nav.js");
const urlUtil = require("../../utils/url.js");
const share = require("../../utils/share.js");

Page({
  data: {
    school: null,
    campuses: [],
    favCount: 0,
    appCount: 0
  },

  onLoad() {
    this.setData({ school: school, campuses: school.campuses });
    share.shareMenuInit();
  },

  onShow() {
    if (typeof this.getTabBar === "function" && this.getTabBar()) {
      this.getTabBar().setData({ selected: 1 });
    }
    this.setData({
      favCount: favorites.count(),
      appCount: applications.count()
    });
  },

  onFavorites() {
    nav.goFavorites();
  },

  onApplications() {
    nav.goApplications();
  },

  onNotice() {
    nav.goDetail("notice");
  },

  onSettings() {
    wx.showActionSheet({
      itemList: ["关于本应用", "清空本地数据"],
      success: (res) => {
        if (res.tapIndex === 0) this.showAbout();
        else if (res.tapIndex === 1) this.confirmClear();
      }
    });
  },

  showAbout() {
    wx.showModal({
      title: "关于本应用",
      content: "成电新生导航 v2\n提供新生报到、宿舍、选课等入学指南与 AI 答疑。\n\n本应用为演示版，全部数据均为示例内容，请以学校官方通知为准。",
      showCancel: false,
      confirmText: "知道了"
    });
  },

  confirmClear() {
    wx.showModal({
      title: "清空本地数据",
      content: "将清空收藏、清单勾选、申请记录与对话历史，确定吗？",
      confirmColor: "#E5533D",
      success: (res) => {
        if (!res.confirm) return;
        storage.clearAll();
        user.resetSid();
        this.setData({ favCount: 0, appCount: 0 });
        wx.showToast({ title: "已清空", icon: "success" });
      }
    });
  },

  onLocationTap(e) {
    urlUtil.openCampus(this.data.campuses[e.currentTarget.dataset.index]);
  },

  onShareAppMessage() {
    return share.buildShare("我的");
  }
});
