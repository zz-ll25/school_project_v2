// pages/index/index.js —— 首页
const dataIndex = require("../../data/index.js");
const school = require("../../data/school.js");
const nav = require("../../utils/nav.js");
const urlUtil = require("../../utils/url.js");
const share = require("../../utils/share.js");

Page({
  data: {
    statusBarHeight: 20,
    school: null,
    guide: [],
    services: [],
    tour: [],
    campuses: []
  },

  onLoad() {
    let sys;
    try {
      sys = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
    } catch (err) {
      sys = wx.getSystemInfoSync();
    }
    this.setData({
      statusBarHeight: sys.statusBarHeight || 20,
      school: school,
      guide: dataIndex.guide,
      services: dataIndex.services,
      tour: dataIndex.tour,
      campuses: school.campuses
    });
    share.shareMenuInit();
  },

  onShow() {
    if (typeof this.getTabBar === "function" && this.getTabBar()) {
      this.getTabBar().setData({ selected: 0 });
    }
  },

  // 宫格选择 → 详情
  onSelect(e) {
    nav.goDetail(e.detail.item.id);
  },

  // 校园介绍横滑卡 → 详情
  onCampusTap(e) {
    nav.goDetail(e.currentTarget.dataset.id);
  },

  // 校区位置卡 → 微信地图
  onLocationTap(e) {
    urlUtil.openCampus(this.data.campuses[e.currentTarget.dataset.index]);
  },

  onSearch() {
    nav.goSearch();
  },

  onAssistant() {
    nav.goAssistant();
  },

  onShareAppMessage() {
    return share.buildShare();
  }
});
