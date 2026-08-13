// components/empty-state/empty-state.js —— 通用空态
Component({
  properties: {
    icon: { type: String, value: "🔍" },
    title: { type: String, value: "暂无内容" },
    desc: { type: String, value: "" },
    btnText: { type: String, value: "" }
  },
  methods: {
    onAction() {
      this.triggerEvent("action");
    }
  }
});
