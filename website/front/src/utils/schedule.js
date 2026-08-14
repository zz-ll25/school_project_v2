// utils/schedule.js —— 课表网格常量：节次时间表 / 8 色课程卡配色（浅底深字）
export const SECTION_TIMES = [
  { n: 1, label: "第1节", time: "08:20" },
  { n: 2, label: "第2节", time: "09:10" },
  { n: 3, label: "第3节", time: "10:20" },
  { n: 4, label: "第4节", time: "11:10" },
  { n: 5, label: "第5节", time: "14:00" },
  { n: 6, label: "第6节", time: "14:50" },
  { n: 7, label: "第7节", time: "16:00" },
  { n: 8, label: "第8节", time: "16:50" },
  { n: 9, label: "第9节", time: "19:00" },
  { n: 10, label: "第10节", time: "19:50" },
  { n: 11, label: "第11节", time: "20:50" },
  { n: 12, label: "第12节", time: "21:40" }
];

export const DAY_NAMES = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];

// 8 色板（colorIndex = courseId % 8），浅底 + 深字
export const COURSE_COLORS = [
  { bg: "#FDE8D7", fg: "#B45A1F" },
  { bg: "#DCEFF9", fg: "#1F6FA8" },
  { bg: "#E3F4E2", fg: "#2E7D32" },
  { bg: "#F9E7F0", fg: "#AD3F7E" },
  { bg: "#F3EBDC", fg: "#8C6D1F" },
  { bg: "#E8E4F7", fg: "#5E4BA6" },
  { bg: "#E0F2F1", fg: "#1F7A70" },
  { bg: "#FDEDED", fg: "#B3453F" }
];

export function courseColor(colorIndex) {
  return COURSE_COLORS[(colorIndex || 0) % COURSE_COLORS.length];
}

// 当前教学周：学期开学日 2026-08-31，clamp 1..20（开学前为第 1 周）
const SEM_START = new Date("2026-08-31T00:00:00");

export function currentWeek() {
  const diff = Math.floor((Date.now() - SEM_START.getTime()) / (7 * 24 * 3600 * 1000)) + 1;
  return Math.min(20, Math.max(1, diff));
}
