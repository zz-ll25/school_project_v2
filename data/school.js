// data/school.js —— 学校基础信息
// 注意：campuses 的经纬度为占位坐标（大致范围），上线前需用真实坐标核实替换。
module.exports = {
  name: "电子科技大学成都学院",
  slogan: "链接成电 · 从这里启程",
  shortSlogan: "新学期 · 新起点 · 新未来",
  intro:
    "电子科技大学成都学院是经教育部批准设立的独立学院，位于四川省成都市高新西区，依托电子科技大学的办学资源，以工为主、多学科协调发展。",
  bannerTitle: "成电启航",
  bannerSub: "新学期 · 新起点 · 新未来",
  campuses: [
    {
      name: "成都校区",
      addr: "四川省成都市高新西区百叶路1号",
      // TODO: 占位坐标，上线前核实
      latitude: 30.7503,
      longitude: 103.9565
    },
    {
      name: "什邡校区",
      addr: "四川省德阳市什邡市京什东路北段99号",
      // TODO: 占位坐标，上线前核实
      latitude: 31.1299,
      longitude: 104.1687
    }
  ]
};
