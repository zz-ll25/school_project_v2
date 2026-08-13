// data/services.js —— 校园服务 4 项
module.exports = [
  {
    id: "startup",
    title: "校园创业",
    icon: "🚀",
    type: "article",
    summary: "大学生创新创业支持",
    keywords: ["创业", "大创", "竞赛", "孵化园", "互联网+"],
    favoritable: true,
    demo: false,
    content: {
      paragraphs: [
        { h: "创业园", p: "学校设有大学生创业孵化园，提供免费工位、导师对接与项目路演机会。" },
        { h: "大创项目", p: "每年开放国家级/省级大学生创新创业训练计划申报，团队可申请经费支持。" },
        { h: "竞赛", p: "互联网+、挑战杯等赛事均有专项辅导，获奖可折算学分。" }
      ]
    }
  },
  {
    id: "secondhand",
    title: "二手闲置",
    icon: "♻️",
    type: "form",
    summary: "学长学姐好物等你淘",
    keywords: ["二手", "闲置", "跳蚤", "求购", "转让"],
    favoritable: true,
    demo: true,
    formSchemaVersion: 1,
    content: {
      intro: "发布或求购二手物品（示例表单，提交后仅保存在本机）。",
      fields: [
        { key: "name", label: "物品名称", placeholder: "如：九成新自行车", type: "text", required: true },
        { key: "price", label: "期望价格", placeholder: "元", type: "number", required: true, format: "price" },
        { key: "contact", label: "联系方式", placeholder: "微信/QQ", type: "text", required: true },
        { key: "desc", label: "描述", placeholder: "成色、取货地点等", type: "textarea", required: false }
      ]
    }
  },
  {
    id: "netbook",
    title: "校园网络预定",
    icon: "🌐",
    type: "form",
    summary: "提前预定宿舍宽带",
    keywords: ["宽带", "预定", "宿舍宽带", "套餐"],
    favoritable: true,
    demo: true,
    formSchemaVersion: 1,
    content: {
      intro: "到校前可在线预定校园宽带，开学即用（示例表单，提交后仅保存在本机）。",
      fields: [
        { key: "sid", label: "学号", placeholder: "请输入学号", type: "text", required: true, format: "sid" },
        { key: "dorm", label: "宿舍号", placeholder: "如：A-302", type: "text", required: true },
        { key: "plan", label: "套餐", placeholder: "请选择", type: "picker", required: true, options: ["30元/月", "学期包", "年包"] }
      ]
    }
  },
  {
    id: "bed",
    title: "床上预定",
    icon: "🛏️",
    type: "form",
    summary: "一站式解决住宿需求",
    keywords: ["床品", "床上用品", "蚊帐", "床垫", "宿舍用品"],
    favoritable: true,
    demo: true,
    formSchemaVersion: 1,
    content: {
      intro: "床品套装、床垫、蚊帐等可提前下单，到校直接铺好（示例表单，提交后仅保存在本机）。",
      fields: [
        { key: "sid", label: "学号", placeholder: "请输入学号", type: "text", required: true, format: "sid" },
        { key: "dorm", label: "宿舍号", placeholder: "如：A-302", type: "text", required: true },
        { key: "kit", label: "套装", placeholder: "请选择", type: "picker", required: true, options: ["基础三件套", "舒适六件套", "豪华九件套"] },
        { key: "phone", label: "手机号", placeholder: "接收配送通知", type: "number", required: true, format: "phone", maxlength: 11 }
      ]
    }
  }
];
