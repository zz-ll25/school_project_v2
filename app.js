// app.js —— 全局入口
App({
  globalData: {
    // 学校基础信息（data/school.js），页面按需 require，这里仅预留
    school: null
  },
  onLaunch() {
    // 启动无副作用：数据、用户态均在各页面加载时初始化
  }
});
