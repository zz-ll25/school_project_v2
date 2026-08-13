// pages/applications/applications.js —— 我的申请（本地保存的表单记录）
const dataIndex = require("../../data/index.js");
const applications = require("../../store/applications.js");
const nav = require("../../utils/nav.js");
const share = require("../../utils/share.js");

Page({
  data: {
    list: [],
    expandedId: ""
  },

  onShow() {
    this.reload();
    share.shareMenuInit();
  },

  // 倒序渲染；展开状态重建
  reload() {
    const list = applications.list().map(function (rec) {
      const fields = this.fieldList(rec);
      return Object.assign({}, rec, {
        timeText: applications.formatTime(rec.submittedAt),
        fields: fields,
        outdated: this.isOutdated(rec)
      });
    }, this);
    this.setData({ list: list, expandedId: "" });
  },

  // 当前 schema 的字段列表（label 从最新数据取，key 失效则显示原始 key）
  fieldList(rec) {
    const item = dataIndex.byId(rec.formId);
    const labels = {};
    if (item && item.content && item.content.fields) {
      item.content.fields.forEach(function (f) {
        labels[f.key] = f.label;
      });
    }
    const out = [];
    Object.keys(rec.values || {}).forEach(function (k) {
      out.push({ key: k, label: labels[k] || k, value: rec.values[k] });
    });
    return out;
  },

  isOutdated(rec) {
    const item = dataIndex.byId(rec.formId);
    const cur = item ? item.formSchemaVersion || 1 : 1;
    return rec.schemaVersion !== cur;
  },

  onToggleExpand(e) {
    const id = e.currentTarget.dataset.id;
    this.setData({ expandedId: this.data.expandedId === id ? "" : id });
  },

  onRemove(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: "删除记录",
      content: "删除后不可恢复，确定删除这条申请记录吗？",
      confirmColor: "#E5533D",
      success: (res) => {
        if (!res.confirm) return;
        applications.remove(id);
        wx.showToast({ title: "已删除", icon: "none" });
        this.reload();
      }
    });
  },

  onGoHome() {
    nav.goHome();
  },

  onShareAppMessage() {
    return share.buildShare("我的申请");
  }
});
