// components/grid-menu/grid-menu.js —— 入口宫格
Component({
  properties: {
    columns: { type: Number, value: 5 },
    list: { type: Array, value: [] }
  },
  methods: {
    onItemTap(e) {
      const idx = e.currentTarget.dataset.index;
      this.triggerEvent("select", { item: this.data.list[idx], index: idx });
    }
  }
});
