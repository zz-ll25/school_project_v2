// data/tour.js —— 校园介绍 3 项（首页横滑卡片）
module.exports = [
  {
    id: "tour-lib",
    title: "图书馆",
    icon: "📚",
    cover: "🏛️",
    type: "article",
    summary: "馆藏丰富，自习圣地",
    keywords: ["图书馆", "自习", "借书", "阅览室"],
    favoritable: true,
    demo: false,
    content: {
      paragraphs: [
        { h: "概况", p: "图书馆建筑面积约 2 万㎡，藏书百万余册，设有电子阅览室与研讨间。" },
        { h: "开放", p: "平日 7:00–22:30，考试周延长至 23:30；凭校园卡入馆。" },
        { h: "预约", p: "自习座位可通过图书馆公众号提前预约。" }
      ]
    }
  },
  {
    id: "tour-lab",
    title: "实验楼",
    icon: "🔬",
    cover: "🧪",
    type: "article",
    summary: "电子信息特色实验室",
    keywords: ["实验楼", "实验室", "嵌入式", "竞赛", "预约"],
    favoritable: true,
    demo: false,
    content: {
      paragraphs: [
        { h: "专业实验室", p: "涵盖电路、嵌入式、网络、智能制造等多个方向，支撑课设与竞赛。" },
        { h: "开放预约", p: "部分实验室面向学生开放预约，用于大创与毕业设计。" }
      ]
    }
  },
  {
    id: "tour-sport",
    title: "运动场",
    icon: "🏟️",
    cover: "⚽",
    type: "article",
    summary: "标准跑道与体育馆",
    keywords: ["运动场", "体育", "跑道", "健身", "篮球"],
    favoritable: true,
    demo: false,
    content: {
      paragraphs: [
        { h: "设施", p: "标准 400m 塑胶跑道、足球场、篮球场、羽毛球馆一应俱全。" },
        { h: "活动", p: "运动会、各类球赛与夜跑活动常年不断，欢迎加入。" }
      ]
    }
  }
];
