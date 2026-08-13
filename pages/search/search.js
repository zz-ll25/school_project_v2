// pages/search/search.js —— 全文搜索
const dataIndex = require("../../data/index.js");
const kb = require("../../data/kb.js");
const nav = require("../../utils/nav.js");
const share = require("../../utils/share.js");

const DEBOUNCE_MS = 300;

Page({
  data: {
    query: "",
    groups: [],   // [{ key, label, results: [{item, titleSegs, summarySegs}] }]
    hot: [],      // 热门搜索 chips
    searching: false
  },

  onLoad() {
    // 热门词取自知识库首词
    this.setData({ hot: kb.slice(0, 6).map(function (e) { return e.q[0]; }) });
    share.shareMenuInit();
  },

  onReady() {
    // 自动聚焦输入框（配合 wxml 的 focus 属性需二次 setData，直接在这里触发）
    this.setData({ focusInput: true });
  },

  onUnload() {
    if (this._timer) clearTimeout(this._timer);
  },

  onInput(e) {
    const q = e.detail.value;
    if (this._timer) clearTimeout(this._timer);
    this.setData({ query: q, searching: true });
    this._timer = setTimeout(() => {
      this.runSearch(q);
    }, DEBOUNCE_MS);
  },

  runSearch(q) {
    const results = dataIndex.search(q);
    // 按集合分组
    const groups = [];
    results.forEach(function (r) {
      let g = null;
      for (let i = 0; i < groups.length; i++) {
        if (groups[i].key === r.col) { g = groups[i]; break; }
      }
      if (!g) {
        g = { key: r.col, label: r.colLabel, results: [] };
        groups.push(g);
      }
      g.results.push(r);
    });
    this.setData({ groups: groups, searching: false });
  },

  onClear() {
    if (this._timer) clearTimeout(this._timer);
    this.setData({ query: "", groups: [], searching: false, focusInput: true });
  },

  onChipTap(e) {
    const q = e.currentTarget.dataset.q;
    this.setData({ query: q, searching: true, focusInput: false });
    this.runSearch(q);
  },

  onResultTap(e) {
    nav.goDetail(e.currentTarget.dataset.id);
  },

  onShareAppMessage() {
    return share.buildShare("新生导航 · 搜索");
  }
});
