// pages/detail/detail.js —— 多类型详情页
const dataIndex = require("../../data/index.js");
const favorites = require("../../store/favorites.js");
const checklist = require("../../store/checklist.js");
const applications = require("../../store/applications.js");
const urlUtil = require("../../utils/url.js");
const nav = require("../../utils/nav.js");
const share = require("../../utils/share.js");

// 表单格式校验规则（required 校验在 validate 中统一处理）
const FORMAT_RULES = {
  phone: { re: /^1[3-9]\d{9}$/, msg: "手机号格式不正确" },
  sid: { re: /^\d{6,12}$/, msg: "学号格式不正确" },
  id6: { re: /^\d{6}$/, msg: "身份证后 6 位格式不正确" },
  price: { re: /^\d+(\.\d{1,2})?$/, msg: "价格格式不正确" }
};

Page({
  data: {
    item: null,
    type: "",
    fav: false,
    items: [],      // list 类型视图数组 [{text, done}]
    doneCount: 0,
    form: {},       // form 类型各字段值
    errors: {}      // form 类型行内错误
  },

  onLoad(options) {
    const item = dataIndex.byId((options && options.id) || "");
    if (!item) {
      wx.showToast({ title: "内容不存在", icon: "none" });
      setTimeout(function () {
        wx.navigateBack({ fail: function () {} });
      }, 600);
      return;
    }
    wx.setNavigationBarTitle({ title: item.title });

    const data = { item: item, type: item.type, fav: favorites.isFav(item.id) };
    if (item.type === "list") {
      data.items = this.buildItems(item);
      data.doneCount = data.items.filter(function (i) { return i.done; }).length;
    }
    if (item.type === "form") {
      const form = {};
      const errors = {};
      (item.content.fields || []).forEach(function (f) {
        form[f.key] = "";
        errors[f.key] = "";
      });
      data.form = form;
      data.errors = errors;
    }
    this.setData(data);
    share.shareMenuInit();
  },

  // 合并持久化勾选状态生成视图数组
  buildItems(item) {
    const map = checklist.getMap(item.id);
    return (item.content.items || []).map(function (it, idx) {
      return { text: it.text, done: !!map[idx] };
    });
  },

  // ---- 收藏 ----
  onToggleFav() {
    const now = favorites.toggle(this.data.item.id);
    this.setData({ fav: now });
    wx.showToast({ title: now ? "已收藏" : "已取消收藏", icon: "none" });
  },

  // ---- 清单勾选 ----
  onToggleItem(e) {
    const idx = e.currentTarget.dataset.idx;
    const map = checklist.toggle(this.data.item.id, idx);
    this.setData({
      ["items[" + idx + "].done"]: !!map[idx],
      doneCount: this.data.items.filter(function (i) { return i.done; }).length
    });
  },

  // ---- 表单 ----
  onFieldInput(e) {
    const key = e.currentTarget.dataset.key;
    this.setData({
      ["form." + key]: e.detail.value,
      ["errors." + key]: ""
    });
  },

  onFieldPicker(e) {
    const key = e.currentTarget.dataset.key;
    const options = e.currentTarget.dataset.options;
    this.setData({
      ["form." + key]: options[e.detail.value],
      ["errors." + key]: ""
    });
  },

  validate() {
    const fields = (this.data.item.content.fields || []).slice();
    const form = this.data.form || {};
    const errors = {};
    let ok = true;
    fields.forEach(function (f) {
      const v = String(form[f.key] == null ? "" : form[f.key]).trim();
      if (f.required && !v) {
        errors[f.key] = "请填写" + f.label;
        ok = false;
        return;
      }
      if (v && f.format && FORMAT_RULES[f.format] && !FORMAT_RULES[f.format].re.test(v)) {
        errors[f.key] = FORMAT_RULES[f.format].msg;
        ok = false;
      }
    });
    this.setData({ errors: errors });
    return ok;
  },

  onSubmit() {
    if (!this.validate()) {
      wx.showToast({ title: "请检查表单", icon: "none" });
      return;
    }
    const item = this.data.item;
    applications.add({
      formId: item.id,
      formTitle: item.title,
      schemaVersion: item.formSchemaVersion || 1,
      values: this.data.form
    });
    wx.showModal({
      title: "提交成功",
      content: "申请已保存在本机（演示），可在「我的申请」中查看",
      confirmText: "去查看",
      cancelText: "留在本页",
      success: function (res) {
        if (res.confirm) nav.goApplications();
      }
    });
  },

  // ---- link 类型 ----
  onCall(e) {
    urlUtil.callPhone(e.currentTarget.dataset.tel);
  },

  onCopy(e) {
    urlUtil.copyLink(e.currentTarget.dataset.link);
  },

  onLinkBtn() {
    const c = this.data.item.content;
    if (c.linkType === "phone") {
      urlUtil.callPhone(c.tel);
    } else {
      urlUtil.copyLink(c.url);
    }
  },

  onShareAppMessage() {
    const item = this.data.item;
    return share.buildShare(
      item ? item.title : null,
      item ? "/pages/detail/detail?id=" + item.id : null
    );
  }
});
