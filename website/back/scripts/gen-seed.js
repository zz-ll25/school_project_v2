// scripts/gen-seed.js —— 种子数据生成（由 db-init.js 建库后调用；也可单独：node scripts/gen-seed.js）
// 内容：2 个演示账号（密码 123456，scrypt 运行时哈希）、课程/课表/成绩/考试、10 条资讯、
//       22 条指南条目（从 ../../data/ 自动导入，零手工迁移）
const { hashPassword } = require("../src/utils/password");
const dataIndex = require("../../../data/index.js");

// GPA 分段（4.0 分制）：90→4.0 85→3.7 82→3.3 78→3.0 75→2.7 72→2.3 68→2.0 64→1.5 60→1.0 <60→0
function gpaOf(score) {
  if (score >= 90) return 4.0;
  if (score >= 85) return 3.7;
  if (score >= 82) return 3.3;
  if (score >= 78) return 3.0;
  if (score >= 75) return 2.7;
  if (score >= 72) return 2.3;
  if (score >= 68) return 2.0;
  if (score >= 64) return 1.5;
  if (score >= 60) return 1.0;
  return 0;
}

// ---------- 演示数据 ----------

const STUDENTS = [
  { studentNo: "2026010001", name: "王小明", major: "计算机科学与技术", className: "计科2601", grade: 2026 },
  { studentNo: "2025010001", name: "李小红", major: "软件工程", className: "软工2501", grade: 2025 }
];

// 课程目录（code 全局唯一；credit/hours/teacher）
const COURSES = [
  // 2026 级 · 2026-2027-1
  { code: "CS1001", name: "高等数学（上）", credit: 5.0, hours: 80, teacher: "张伟" },
  { code: "EN1001", name: "大学英语（一）", credit: 3.0, hours: 48, teacher: "李娜" },
  { code: "CS1002", name: "程序设计基础", credit: 4.0, hours: 64, teacher: "王强" },
  { code: "CS1003", name: "计算机导论", credit: 2.5, hours: 40, teacher: "刘洋" },
  { code: "MS1001", name: "军事理论", credit: 2.0, hours: 32, teacher: "陈教官" },
  { code: "PS1001", name: "形势与政策", credit: 0.5, hours: 8, teacher: "赵老师" },
  { code: "MO1001", name: "思想道德与法治", credit: 3.0, hours: 48, teacher: "孙老师" },
  { code: "PE1001", name: "体育（一）", credit: 1.0, hours: 32, teacher: "周教练" },
  // 2025 级 · 2026-2027-1
  { code: "CS2001", name: "数据结构", credit: 4.0, hours: 64, teacher: "张伟" },
  { code: "CS2002", name: "离散数学", credit: 3.0, hours: 48, teacher: "刘洋" },
  { code: "CS2003", name: "数字逻辑", credit: 3.5, hours: 56, teacher: "王强" },
  { code: "MA2001", name: "概率论与数理统计", credit: 3.0, hours: 48, teacher: "李娜" },
  { code: "EN2001", name: "大学英语（三）", credit: 3.0, hours: 48, teacher: "何老师" },
  { code: "MO2001", name: "马克思主义基本原理", credit: 3.0, hours: 48, teacher: "孙老师" },
  { code: "PE2001", name: "体育（三）", credit: 1.0, hours: 32, teacher: "周教练" },
  { code: "CS2004", name: "操作系统", credit: 4.0, hours: 64, teacher: "陈老师" },
  // 历史学期（李小红成绩用）
  { code: "MA1001", name: "高等数学（下）", credit: 5.0, hours: 80, teacher: "张伟" },
  { code: "EN1002", name: "大学英语（二）", credit: 3.0, hours: 48, teacher: "李娜" },
  { code: "MA2002", name: "线性代数", credit: 3.0, hours: 48, teacher: "赵老师" },
  { code: "PH1001", name: "大学物理", credit: 4.0, hours: 64, teacher: "钱老师" },
  { code: "CS1004", name: "C++程序设计", credit: 3.5, hours: 56, teacher: "王强" },
  { code: "PE1002", name: "体育（二）", credit: 1.0, hours: 32, teacher: "周教练" },
  { code: "HI1001", name: "中国近现代史纲要", credit: 3.0, hours: 48, teacher: "吴老师" },
  { code: "CS2005", name: "计算机组成原理", credit: 3.5, hours: 56, teacher: "陈老师" },
  { code: "ET1001", name: "工程伦理", credit: 2.0, hours: 32, teacher: "孙老师" }
];

// 课表（一行 = 一个上课时段）。王小明：8 门课 10 时段；李小红：8 门课 11 时段
// semester 统一 2026-2027-1；week 默认 1-16，形势与政策/军事理论用短周演示周次过滤
const SELECTIONS = [
  // ---- 王小明 ----
  { s: "2026010001", c: "CS1001", d: 1, ss: 1, es: 2, sw: 1, ew: 16, loc: "教学东楼A101" },
  { s: "2026010001", c: "CS1001", d: 3, ss: 1, es: 2, sw: 1, ew: 16, loc: "教学东楼A101" },
  { s: "2026010001", c: "EN1001", d: 1, ss: 3, es: 4, sw: 1, ew: 16, loc: "外语楼B202" },
  { s: "2026010001", c: "CS1002", d: 2, ss: 1, es: 2, sw: 1, ew: 16, loc: "机房C301" },
  { s: "2026010001", c: "CS1002", d: 5, ss: 5, es: 6, sw: 1, ew: 16, loc: "机房C301" },
  { s: "2026010001", c: "CS1003", d: 4, ss: 1, es: 2, sw: 1, ew: 16, loc: "教学楼D201" },
  { s: "2026010001", c: "MS1001", d: 2, ss: 7, es: 8, sw: 1, ew: 8, loc: "教学楼D104" },
  { s: "2026010001", c: "PS1001", d: 4, ss: 9, es: 10, sw: 1, ew: 4, loc: "学术报告厅" },
  { s: "2026010001", c: "MO1001", d: 3, ss: 5, es: 6, sw: 1, ew: 16, loc: "教学楼D102" },
  { s: "2026010001", c: "PE1001", d: 5, ss: 3, es: 4, sw: 1, ew: 16, loc: "体育馆" },
  // ---- 李小红 ----
  { s: "2025010001", c: "CS2001", d: 1, ss: 1, es: 2, sw: 1, ew: 16, loc: "教学楼D301" },
  { s: "2025010001", c: "CS2001", d: 4, ss: 3, es: 4, sw: 1, ew: 16, loc: "教学楼D301" },
  { s: "2025010001", c: "CS2002", d: 1, ss: 3, es: 4, sw: 1, ew: 16, loc: "教学楼D205" },
  { s: "2025010001", c: "CS2003", d: 2, ss: 1, es: 2, sw: 1, ew: 16, loc: "实验室E101" },
  { s: "2025010001", c: "CS2003", d: 5, ss: 1, es: 2, sw: 1, ew: 16, loc: "实验室E101" },
  { s: "2025010001", c: "MA2001", d: 2, ss: 3, es: 4, sw: 1, ew: 16, loc: "教学楼D203" },
  { s: "2025010001", c: "EN2001", d: 3, ss: 1, es: 2, sw: 1, ew: 16, loc: "外语楼B305" },
  { s: "2025010001", c: "MO2001", d: 3, ss: 3, es: 4, sw: 1, ew: 16, loc: "教学楼D102" },
  { s: "2025010001", c: "PE2001", d: 4, ss: 7, es: 8, sw: 1, ew: 16, loc: "体育馆" },
  { s: "2025010001", c: "CS2004", d: 5, ss: 3, es: 4, sw: 1, ew: 16, loc: "机房C402" },
  { s: "2025010001", c: "CS2004", d: 5, ss: 7, es: 8, sw: 1, ew: 16, loc: "机房C402" }
];

// 李小红成绩：2025-2026-1 九门 + 2025-2026-2 八门 = 17 条；高数（上）52 分补考 66
// score 存原始分；补考后最终分 = resit_score
const GRADES = [
  { c: "CS1001", sem: "2025-2026-1", score: 52, resit: true, resitScore: 66 },
  { c: "EN1001", sem: "2025-2026-1", score: 86 },
  { c: "CS1002", sem: "2025-2026-1", score: 92 },
  { c: "CS1003", sem: "2025-2026-1", score: 78 },
  { c: "MS1001", sem: "2025-2026-1", score: 88 },
  { c: "MO1001", sem: "2025-2026-1", score: 81 },
  { c: "PS1001", sem: "2025-2026-1", score: 90 },
  { c: "PE1001", sem: "2025-2026-1", score: 85 },
  { c: "ET1001", sem: "2025-2026-1", score: 75 },
  { c: "MA1001", sem: "2025-2026-2", score: 68 },
  { c: "EN1002", sem: "2025-2026-2", score: 83 },
  { c: "MA2002", sem: "2025-2026-2", score: 72 },
  { c: "PH1001", sem: "2025-2026-2", score: 64 },
  { c: "CS1004", sem: "2025-2026-2", score: 77 },
  { c: "PE1002", sem: "2025-2026-2", score: 95 },
  { c: "HI1001", sem: "2025-2026-2", score: 70 },
  { c: "CS2005", sem: "2025-2026-2", score: 88 }
];

// 考试（2026-2027-1 期末）：王小明 6 场（体育/形势与政策为考查课无笔试）、李小红 8 场
const EXAMS = [
  { s: "2026010001", c: "CS1001", dt: "2026-12-28 09:00:00", loc: "教学东楼A101" },
  { s: "2026010001", c: "EN1001", dt: "2026-12-29 09:00:00", loc: "外语楼B202" },
  { s: "2026010001", c: "CS1002", dt: "2026-12-30 14:00:00", loc: "机房C301" },
  { s: "2026010001", c: "CS1003", dt: "2027-01-02 09:00:00", loc: "教学楼D201" },
  { s: "2026010001", c: "MO1001", dt: "2027-01-05 09:00:00", loc: "教学楼D102" },
  { s: "2026010001", c: "MS1001", dt: "2027-01-08 14:00:00", loc: "教学楼D104" },
  { s: "2025010001", c: "CS2001", dt: "2026-12-28 09:00:00", loc: "教学楼D301" },
  { s: "2025010001", c: "CS2002", dt: "2026-12-29 14:00:00", loc: "教学楼D205" },
  { s: "2025010001", c: "CS2003", dt: "2026-12-30 09:00:00", loc: "实验室E101" },
  { s: "2025010001", c: "MA2001", dt: "2027-01-02 14:00:00", loc: "教学楼D203" },
  { s: "2025010001", c: "EN2001", dt: "2027-01-05 09:00:00", loc: "外语楼B305" },
  { s: "2025010001", c: "MO2001", dt: "2027-01-06 09:00:00", loc: "教学楼D102" },
  { s: "2025010001", c: "CS2004", dt: "2027-01-07 14:00:00", loc: "机房C402" },
  { s: "2025010001", c: "PE2001", dt: "2027-01-08 10:00:00", loc: "体育馆" }
];

// 资讯 10 条（通知公告 4 / 学校新闻 3 / 教务动态 3，前 2 条置顶）
const NEWS = [
  { title: "关于 2026 级新生报到时间安排的通知", cat: "通知公告", top: 1, views: 3521, dt: "2026-07-28 09:00:00",
    summary: "2026 级新生请于 9 月 1 日至 2 日持录取通知书到校报到。",
    content: [{ h: "报到时间", p: "9 月 1 日—9 月 2 日 8:00-18:00，逾期需提前联系辅导员说明情况。" },
              { h: "报到地点", p: "学校体育馆一层新生报到处，请携带录取通知书原件、身份证及复印件。" }] },
  { title: "我校 2026 年招生录取工作圆满完成", cat: "学校新闻", top: 1, views: 2810, dt: "2026-07-25 10:30:00",
    summary: "本科批次录取通知书已全部寄出，请新生留意查收。",
    content: [{ h: "录取情况", p: "2026 年我校面向全国 26 个省份招生，生源质量稳中有升。" },
              { h: "通知书寄送", p: "录取通知书已通过 EMS 分批寄出，可在招生网查询物流单号。" }] },
  { title: "关于开展 2026-2027 学年第一学期选课工作的通知", cat: "教务动态", top: 0, views: 1987, dt: "2026-07-20 08:00:00",
    summary: "正选阶段将于 8 月 25 日 9:00 开始，请提前登录教务系统熟悉流程。",
    content: [{ h: "时间安排", p: "正选 8 月 25 日—27 日；补退选 9 月 5 日—7 日。" },
              { h: "注意事项", p: "正选采用先到先得原则，热门课程名额有限，请提前规划备选方案。" }] },
  { title: "新生线上选宿系统操作指南", cat: "通知公告", top: 0, views: 1654, dt: "2026-07-18 14:00:00",
    summary: "8 月 18 日 9:00 起登录迎新系统选择宿舍，先到先得。",
    content: [{ h: "开放时间", p: "8 月 18 日 9:00 至 8 月 25 日 18:00。" },
              { h: "操作步骤", p: "登录迎新系统 → 选宿模块 → 选择楼栋与床位 → 确认提交。" }] },
  { title: "关于校园一卡通升级维护的公告", cat: "通知公告", top: 0, views: 1203, dt: "2026-07-15 16:00:00",
    summary: "8 月 10 日—12 日一卡通系统升级，暂停充值业务。",
    content: [{ h: "维护时间", p: "8 月 10 日 22:00 至 8 月 12 日 6:00。" },
              { h: "影响范围", p: "维护期间暂停线上充值与挂失业务，实体卡消费不受影响。" }] },
  { title: "学校与多家企业共建实习基地签约仪式举行", cat: "学校新闻", top: 0, views: 986, dt: "2026-07-10 11:00:00",
    summary: "本次签约涵盖软件研发、智能制造等方向，为学生实习实训提供保障。",
    content: [{ h: "签约内容", p: "学校与 12 家企业签署实习基地共建协议，覆盖软件研发、智能制造等方向。" },
              { h: "后续计划", p: "本学期将组织学生分批赴基地开展认知实习与暑期实践。" }] },
  { title: "2026 年秋季学期教材发放安排", cat: "教务动态", top: 0, views: 1542, dt: "2026-07-08 09:30:00",
    summary: "教材发放时间为 8 月 30 日至 31 日，按学院分批领取。",
    content: [{ h: "发放安排", p: "8 月 30 日：计算机学院、信息与通信学院；8 月 31 日：其余学院。" },
              { h: "领取凭证", p: "凭校园卡在教材中心领取，教材费从预存款中扣除。" }] },
  { title: "新生军训服装领取与军训安排通知", cat: "通知公告", top: 0, views: 2108, dt: "2026-07-05 08:30:00",
    summary: "军训服装于报到当日在体育馆统一发放，军训时间为 9 月 3 日至 16 日。",
    content: [{ h: "服装领取", p: "报到当日在体育馆凭校园卡领取，请当场试穿确认尺码。" },
              { h: "军训安排", p: "9 月 3 日—16 日，共 14 天；因身体原因不能参训者请提前办理免训手续。" }] },
  { title: "校园网络升级改造施工公告", cat: "学校新闻", top: 0, views: 873, dt: "2026-07-01 15:00:00",
    summary: "暑期将对学生宿舍区网络进行升级改造，实现全楼 WiFi 6 覆盖。",
    content: [{ h: "施工时间", p: "7 月 20 日至 8 月 20 日，学生宿舍区 1-8 栋分批施工。" },
              { h: "改造内容", p: "全楼 WiFi 6 覆盖，宿舍有线端口千兆升级。" }] },
  { title: "关于期末考试时间与考场安排的通知", cat: "教务动态", top: 0, views: 1679, dt: "2026-06-28 10:00:00",
    summary: "本学期期末考试时间为 2026 年 12 月 28 日至 2027 年 1 月 8 日。",
    content: [{ h: "考试时间", p: "2026 年 12 月 28 日—2027 年 1 月 8 日，具体考场以教务系统查询为准。" },
              { h: "考试纪律", p: "请携带学生证提前 15 分钟入场，严禁携带手机等电子设备。" }] }
];

// ---------- 写入 ----------

async function run(db) {
  // 1. 学生
  for (const st of STUDENTS) {
    await db.execute(
      "INSERT INTO students (student_no, name, password_hash, major, class_name, grade) VALUES (?, ?, ?, ?, ?, ?)",
      [st.studentNo, st.name, hashPassword("123456"), st.major, st.className, st.grade]
    );
  }

  // 2. 课程目录
  const courseId = {};
  for (const c of COURSES) {
    const [r] = await db.execute(
      "INSERT INTO courses (course_code, name, credit, hours, teacher) VALUES (?, ?, ?, ?, ?)",
      [c.code, c.name, c.credit, c.hours, c.teacher]
    );
    courseId[c.code] = r.insertId;
  }

  // 3. 课表
  for (const sel of SELECTIONS) {
    await db.execute(
      "INSERT INTO course_selections (student_no, course_id, semester, week_day, start_section, end_section, start_week, end_week, location) VALUES (?, ?, '2026-2027-1', ?, ?, ?, ?, ?, ?)",
      [sel.s, courseId[sel.c], sel.d, sel.ss, sel.es, sel.sw, sel.ew, sel.loc]
    );
  }

  // 4. 成绩（李小红）
  for (const g of GRADES) {
    const credit = COURSES.find((c) => c.code === g.c).credit;
    const finalScore = g.resit ? g.resitScore : g.score;
    await db.execute(
      "INSERT INTO grades (student_no, course_id, semester, score, credit, gpa_points, is_resit, resit_score) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      ["2025010001", courseId[g.c], g.sem, g.score, credit, gpaOf(finalScore), g.resit ? 1 : 0, g.resit ? g.resitScore : null]
    );
  }

  // 5. 考试
  for (const e of EXAMS) {
    const course = COURSES.find((c) => c.code === e.c);
    const seatNo = String(e.s).slice(-2);
    await db.execute(
      "INSERT INTO exams (course_id, student_no, name, exam_date, location, seat_no, semester) VALUES (?, ?, ?, ?, ?, ?, '2026-2027-1')",
      [courseId[e.c], e.s, course.name + "期末考试", e.dt, e.loc, seatNo]
    );
  }

  // 6. 资讯
  for (const n of NEWS) {
    await db.execute(
      "INSERT INTO news (title, category, summary, content, is_top, views, published_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [n.title, n.cat, n.summary, JSON.stringify(n.content), n.top, n.views, n.dt]
    );
  }

  // 7. 指南条目（22 条，从 data/ 自动导入）
  let order = 0;
  for (const col of dataIndex.collections()) {
    for (const item of col.items) {
      await db.execute(
        "INSERT INTO guide_items (item_id, title, icon, type, category, summary, keywords, content, favoritable, demo, form_schema_version, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [item.id, item.title, item.icon || "📄", item.type, col.key, item.summary || "",
         JSON.stringify(item.keywords || []), JSON.stringify(item.content || {}),
         item.favoritable === false ? 0 : 1, item.demo ? 1 : 0,
         item.formSchemaVersion || null, order++]
      );
    }
  }

  // 汇总
  const count = async (table) => {
    const [rows] = await db.execute("SELECT COUNT(*) AS n FROM " + table);
    return rows[0].n;
  };
  const tables = ["students", "courses", "course_selections", "grades", "exams", "news", "guide_items"];
  const out = {};
  for (const t of tables) out[t] = await count(t);
  return out;
}

module.exports = { run: run, gpaOf: gpaOf };

// 单独执行：node scripts/gen-seed.js（复用配置连接，库须已建）
if (require.main === module) {
  const { pool } = require("../src/db/pool");
  run(pool)
    .then((out) => {
      console.log("seed done:", out);
      return pool.end();
    })
    .catch((e) => {
      console.error("seed failed:", e);
      process.exit(1);
    });
}
