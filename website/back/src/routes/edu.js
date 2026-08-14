// src/routes/edu.js —— 教务接口：学生信息 / 课表 / 成绩（加权 GPA） / 考试安排（均需登录）
const express = require("express");
const { pool } = require("../db/pool");
const { ok, fail } = require("../utils/envelope");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
// 注意：requireAuth 逐路由显式挂载（不能用 router.use），否则会拦截同挂载点的其他路由（如 /news）

// 当前学生信息
router.get("/edu/student", requireAuth, (req, res) => {
  ok(res, req.student);
});

// 课表：?semester= 指定学期，缺省取最新学期；返回学期列表 + 课程时段（含 colorIndex）
router.get("/edu/schedule", requireAuth, async (req, res, next) => {
  try {
    const sid = req.student.studentNo;
    const [semRows] = await pool.execute(
      "SELECT DISTINCT semester FROM course_selections WHERE student_no = ? ORDER BY semester DESC",
      [sid]
    );
    const semesters = semRows.map((r) => r.semester);
    const semester = req.query.semester || semesters[0] || "";
    if (!semester) return ok(res, { semesters: [], semester: "", courses: [] });

    const [rows] = await pool.execute(
      `SELECT cs.course_id, c.course_code, c.name, c.credit, c.teacher,
              cs.week_day, cs.start_section, cs.end_section, cs.start_week, cs.end_week, cs.location
       FROM course_selections cs JOIN courses c ON c.id = cs.course_id
       WHERE cs.student_no = ? AND cs.semester = ?
       ORDER BY cs.week_day, cs.start_section`,
      [sid, semester]
    );
    const courses = rows.map((r) => ({
      courseId: r.course_id,
      courseCode: r.course_code,
      courseName: r.name,
      credit: Number(r.credit),
      teacher: r.teacher,
      weekDay: r.week_day,
      startSection: r.start_section,
      endSection: r.end_section,
      startWeek: r.start_week,
      endWeek: r.end_week,
      location: r.location,
      colorIndex: r.course_id % 8
    }));
    ok(res, { semesters: semesters, semester: semester, courses: courses });
  } catch (e) {
    next(e);
  }
});

// 成绩：?semester= 指定学期；stats 为选定学期统计（及格课程计）
// 加权 GPA = Σ(gpa×credit)/Σcredit；加权平均分 = Σ(score×credit)/Σcredit（补考课程按补考分）
router.get("/edu/grades", requireAuth, async (req, res, next) => {
  try {
    const sid = req.student.studentNo;
    const [semRows] = await pool.execute(
      "SELECT DISTINCT semester FROM grades WHERE student_no = ? ORDER BY semester DESC",
      [sid]
    );
    const semesters = semRows.map((r) => r.semester);
    const semester = req.query.semester || semesters[0] || "";
    if (!semester) return ok(res, { semesters: [], semester: "", grades: [], stats: { totalCredits: 0, weightedGpa: 0, avgScore: 0 } });

    const [rows] = await pool.execute(
      `SELECT g.course_id, c.name, g.semester, g.score, g.credit, g.gpa_points, g.is_resit, g.resit_score
       FROM grades g JOIN courses c ON c.id = g.course_id
       WHERE g.student_no = ? AND g.semester = ?
       ORDER BY g.id`,
      [sid, semester]
    );
    const grades = rows.map((r) => ({
      courseId: r.course_id,
      courseName: r.name,
      semester: r.semester,
      score: Number(r.score),
      credit: Number(r.credit),
      gpaPoints: Number(r.gpa_points),
      isResit: !!r.is_resit,
      resitScore: r.resit_score === null ? null : Number(r.resit_score)
    }));

    // 统计：及格（含补考及格）课程计学分
    let totalCredits = 0, gpaSum = 0, scoreSum = 0;
    grades.forEach((g) => {
      const finalScore = g.isResit && g.resitScore !== null ? g.resitScore : g.score;
      if (finalScore < 60) return;
      totalCredits += g.credit;
      gpaSum += g.gpaPoints * g.credit; // gpa_points 已按最终分（补考后）计算
      scoreSum += finalScore * g.credit;
    });
    const stats = {
      totalCredits: Math.round(totalCredits * 10) / 10,
      weightedGpa: totalCredits ? Math.round((gpaSum / totalCredits) * 100) / 100 : 0,
      avgScore: totalCredits ? Math.round((scoreSum / totalCredits) * 100) / 100 : 0
    };
    ok(res, { semesters: semesters, semester: semester, grades: grades, stats: stats });
  } catch (e) {
    next(e);
  }
});

// 考试安排（日期升序，含已结束）
router.get("/edu/exams", requireAuth, async (req, res, next) => {
  try {
    const sid = req.student.studentNo;
    const [rows] = await pool.execute(
      `SELECT e.name, e.exam_date, e.location, e.seat_no, e.semester, c.name AS course_name
       FROM exams e JOIN courses c ON c.id = e.course_id
       WHERE e.student_no = ?
       ORDER BY e.exam_date ASC`,
      [sid]
    );
    const exams = rows.map((r) => ({
      courseName: r.course_name,
      name: r.name,
      examDate: r.exam_date,
      location: r.location,
      seatNo: r.seat_no,
      semester: r.semester
    }));
    ok(res, { exams: exams });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
