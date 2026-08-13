// data/guide.js —— 新生必看 15 项
// 字段约定：
//   id 全局唯一稳定串（收藏/清单/申请以此关联，勿改）
//   type: list(清单) | article(图文) | notice(公告流) | link(外链/拨号) | form(表单)
//   keywords: 搜索增强词；demo: true 表示演示数据（页面显示「示例」徽章）
//   list 的 items 只存 text —— 勾选状态存 store/checklist，不写在数据里
module.exports = [
  {
    id: "must-list",
    title: "必备清单",
    icon: "🎒",
    type: "list",
    summary: "入学报到随身要带的东西",
    keywords: ["必备", "证件", "报到材料", "录取通知书", "行李"],
    favoritable: true,
    demo: false,
    content: {
      items: [
        { text: "录取通知书（原件）" },
        { text: "身份证及身份证正反面复印件 3 份" },
        { text: "团员/党员档案、高考纸质档案（勿拆封）" },
        { text: "一寸/两寸免冠蓝底照片各 8 张" },
        { text: "银行卡、少量现金、校园一卡通" }
      ]
    }
  },
  {
    id: "dorm",
    title: "宿舍生活",
    icon: "🛏️",
    type: "list",
    summary: "宿舍规格与住宿须知",
    keywords: ["宿舍", "寝室", "住宿", "门禁", "电器"],
    favoritable: true,
    demo: false,
    content: {
      items: [
        { text: "标准 4–6 人间，独立卫生间 + 空调" },
        { text: "门禁时间 23:00，晚归需在前台登记" },
        { text: "水电费通过「校园一卡通」小程序充值" },
        { text: "禁止使用 >300W 大功率电器" }
      ]
    }
  },
  {
    id: "traffic",
    title: "交通出行",
    icon: "🚌",
    type: "article",
    summary: "怎么到学校和在校内通勤",
    keywords: ["交通", "地铁", "公交", "机场", "到校", "路线"],
    favoritable: true,
    demo: false,
    content: {
      paragraphs: [
        { h: "到成都校区", p: "地铁 2 号线至「百草路」站，转乘公交或打车约 10 分钟到校；自驾导航「电子科技大学成都学院(成都校区)」。" },
        { h: "从机场/车站", p: "双流机场乘地铁 10 号线转 2 号线；火车北站乘地铁 1 号线转 2 号线；成都东站乘地铁 2 号线直达。" },
        { h: "校内通勤", p: "校区不大，步行即可；共享单车在校门口可借。" }
      ]
    }
  },
  {
    id: "wifi",
    title: "校园网络",
    icon: "📶",
    type: "form",
    summary: "开户校园网与套餐办理",
    keywords: ["校园网", "宽带", "wifi", "网络", "开户", "认证"],
    favoritable: true,
    demo: true,
    formSchemaVersion: 1,
    content: {
      intro: "填写以下信息即可在线提交校园网开户申请（示例表单，提交后仅保存在本机）。",
      fields: [
        { key: "sid", label: "学号", placeholder: "请输入学号", type: "text", required: true, format: "sid" },
        { key: "id6", label: "身份证后 6 位", placeholder: "用于实名认证", type: "text", required: true, format: "id6" },
        { key: "phone", label: "手机号", placeholder: "接收验证码", type: "number", required: true, format: "phone", maxlength: 11 },
        { key: "plan", label: "套餐", placeholder: "请选择", type: "picker", required: true, options: ["20元/月", "30元/月", "学期包"] }
      ]
    }
  },
  {
    id: "food",
    title: "餐饮美食",
    icon: "🍜",
    type: "list",
    summary: "食堂窗口与周边美食",
    keywords: ["食堂", "美食", "餐饮", "吃饭", "小吃"],
    favoritable: true,
    demo: false,
    content: {
      items: [
        { text: "一食堂：二楼自选 + 一楼面档，性价比高" },
        { text: "二食堂：特色档口（麻辣香锅、冒菜）" },
        { text: "校门小吃街：炸串、奶茶、烧烤" },
        { text: "清真窗口在一食堂三楼" }
      ]
    }
  },
  {
    id: "register",
    title: "报道流程",
    icon: "📝",
    type: "link",
    summary: "官方新生报到指南",
    keywords: ["报到", "报到流程", "入学", "官网"],
    favoritable: true,
    demo: true,
    content: {
      linkType: "web",
      url: "https://www.cduestc.cn",
      btnText: "查看官方报到指南",
      desc: "点击跳转学校官网新生专栏（示例链接，可替换为真实指南页）。"
    }
  },
  {
    id: "express",
    title: "快递地址",
    icon: "📦",
    type: "article",
    summary: "收快递该怎么填地址",
    keywords: ["快递", "收件", "地址", "菜鸟驿站", "取件"],
    favoritable: true,
    demo: false,
    content: {
      paragraphs: [
        { h: "成都校区收件地址", p: "四川省成都市高新西区百叶路1号 电子科技大学成都学院（请注明楼栋/宿舍号）。" },
        { h: "取件点", p: "校内菜鸟驿站位于生活区，凭取件码自助取件；大件可约驿站送货上门。" },
        { h: "温馨提示", p: "开学季快递量大，建议错峰邮寄；贵重物品随身携带。" }
      ]
    }
  },
  {
    id: "tel",
    title: "学校电话",
    icon: "☎️",
    type: "link",
    summary: "各部门常用联系电话",
    keywords: ["电话", "招生办", "联系", "咨询", "教务处"],
    favoritable: true,
    demo: true,
    content: {
      linkType: "phone",
      tel: "028-87825027",
      btnText: "拨打招生就业处",
      desc: "招生就业处：028-87825027（示例号码，可替换为真实信息）。",
      extra: [
        { label: "教务处", tel: "028-87820000" },
        { label: "保卫处", tel: "028-87820110" },
        { label: "校医院", tel: "028-87820200" }
      ]
    }
  },
  {
    id: "club",
    title: "校园社团",
    icon: "🎭",
    type: "list",
    summary: "总有一个适合你",
    keywords: ["社团", "协会", "百团大战", "招新", "兴趣"],
    favoritable: true,
    demo: false,
    content: {
      items: [
        { text: "学术科技类：电子协会、ACM 社团、机器人队" },
        { text: "文艺体育类：街舞社、吉他社、篮球协会" },
        { text: "公益实践类：青年志愿者协会、支教团" },
        { text: "招新时间：开学第二周「百团大战」" }
      ]
    }
  },
  {
    id: "docs",
    title: "文件资料",
    icon: "📄",
    type: "list",
    summary: "报到要提交的材料",
    keywords: ["文件", "资料", "材料", "档案", "证明", "兵役"],
    favoritable: true,
    demo: false,
    content: {
      items: [
        { text: "录取通知书（交回学校存档）" },
        { text: "户口本首页及本人页复印件" },
        { text: "贫困认定/助学贷款材料（如适用）" },
        { text: "兵役登记证明（男生）" }
      ]
    }
  },
  {
    id: "notice",
    title: "通知公告",
    icon: "📢",
    type: "notice",
    summary: "最新官方通知",
    keywords: ["公告", "通知", "军训", "选宿", "报到时间"],
    favoritable: true,
    demo: false,
    content: {
      items: [
        { date: "08-25", title: "2026 级新生报到时间安排", body: "请于 9 月 1 日—9 月 2 日持录取通知书到校报到，逾期需联系辅导员。" },
        { date: "08-20", title: "关于军训服装统一领取的通知", body: "军训服装将于报到当日于体育馆统一发放，请携带本人校园卡。" },
        { date: "08-15", title: "新生线上选宿系统开放", body: "8 月 18 日 9:00 起登录迎新系统选择宿舍，先到先得。" }
      ]
    }
  },
  {
    id: "card",
    title: "一卡通",
    icon: "💳",
    type: "form",
    summary: "绑定你的校园卡",
    keywords: ["一卡通", "校园卡", "饭卡", "充值", "绑定", "挂失"],
    favoritable: true,
    demo: true,
    formSchemaVersion: 1,
    content: {
      intro: "绑定后可查询余额、在线充值（示例表单，提交后仅保存在本机）。",
      fields: [
        { key: "sid", label: "学号", placeholder: "请输入学号", type: "text", required: true, format: "sid" },
        { key: "cardNo", label: "卡号", placeholder: "校园卡背面 10 位", type: "text", required: true, maxlength: 10 },
        { key: "phone", label: "手机号", placeholder: "用于找回", type: "number", required: true, format: "phone", maxlength: 11 }
      ]
    }
  },
  {
    id: "transfer",
    title: "转专业要点",
    icon: "🔁",
    type: "article",
    summary: "想转专业看这里",
    keywords: ["转专业", "转系", "申请", "绩点"],
    favoritable: true,
    demo: false,
    content: {
      paragraphs: [
        { h: "申请时间", p: "一般在大一结束、大二开学初开放申请，具体以教务处通知为准。" },
        { h: "基本条件", p: "无挂科、无违纪记录；部分专业需笔试/面试；艺术、体育类有转入限制。" },
        { h: "流程", p: "线上提交申请 → 转出/转入学院审核 → 教务处公示 → 办理学籍异动。" }
      ]
    }
  },
  {
    id: "course",
    title: "抢课",
    icon: "⚡",
    type: "article",
    summary: "选课系统 & 抢课攻略",
    keywords: ["选课", "抢课", "课表", "教务", "学分"],
    favoritable: true,
    demo: false,
    content: {
      paragraphs: [
        { h: "系统入口", p: "登录学校教务系统（电脑端体验更佳），在「选课」模块操作。" },
        { h: "开放时间", p: "正选、补退选分轮次开放，热门课名额紧张，建议提前 5 分钟登录。" },
        { h: "抢课技巧", p: "选好备选课程；用校园网比外网更稳定；错峰操作避免系统拥堵。" }
      ]
    }
  },
  {
    id: "group",
    title: "新生群",
    icon: "💬",
    type: "link",
    summary: "找到你的组织",
    keywords: ["新生群", "qq群", "交流群", "组织", "同乡"],
    favoritable: true,
    demo: true,
    content: {
      linkType: "url",
      url: "https://qm.qq.com",
      btnText: "加入官方新生QQ群",
      desc: "扫码或点击加入本院系官方新生群（示例链接，可替换为真实群二维码页）。"
    }
  }
];
