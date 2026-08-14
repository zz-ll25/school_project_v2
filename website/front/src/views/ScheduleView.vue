<template>
  <div class="page">
    <div class="sch-head">
      <h1 class="page-title">周课表</h1>
      <div class="sch-controls">
        <el-select v-model="week" style="width: 130px" @change="applyWeek">
          <el-option v-for="w in 20" :key="w" :label="'第 ' + w + ' 周'" :value="w" />
        </el-select>
        <el-select v-if="semesters.length > 1" v-model="semester" style="width: 180px" @change="load">
          <el-option v-for="s in semesters" :key="s" :label="s" :value="s" />
        </el-select>
      </div>
    </div>

    <div v-if="visibleCourses.length" class="ui-card sch-board">
      <!-- 表头 -->
      <div class="sch-row sch-head-row">
        <div class="sch-time-cell">时间</div>
        <div v-for="d in 7" :key="d" class="sch-day-cell">{{ dayNames[d - 1] }}</div>
      </div>
      <!-- 网格体 -->
      <div class="sch-grid">
        <!-- 左侧时间轴 -->
        <div class="sch-axis">
          <div v-for="s in sectionTimes" :key="s.n" class="sch-slot" :class="{ 'slot-bound': isBound(s.n) }">
            <span class="slot-label">{{ s.n }}</span>
          </div>
        </div>
        <!-- 7 列 -->
        <div v-for="d in 7" :key="d" class="sch-col">
          <div v-for="s in sectionTimes" :key="s.n" class="sch-slot" :class="{ 'slot-bound': isBound(s.n) }"></div>
          <div v-for="c in dayCourses(d)" :key="c.courseId + '-' + c.startSection" class="course-card"
            :style="cardStyle(c)" @click="showCourse(c)">
            <div class="course-name" :style="{ color: courseColor(c.colorIndex).fg }">{{ c.courseName }}</div>
            <div class="course-loc">{{ c.location }}</div>
          </div>
        </div>
      </div>
    </div>
    <EmptyState v-else icon="🗓️" title="本学期暂无课程" desc="选课数据为演示内容" />
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { ElMessageBox } from "element-plus";
import { eduApi } from "../api/edu";
import { DAY_NAMES, SECTION_TIMES, courseColor, currentWeek } from "../utils/schedule";
import EmptyState from "../components/EmptyState.vue";

const dayNames = DAY_NAMES;
const sectionTimes = SECTION_TIMES;
const SLOT_H = 56; // 每节 56px

const semester = ref("");
const semesters = ref([]);
const week = ref(currentWeek());
const courses = ref([]);

// 第 2/4/6/8/10/12 节后加分隔线
function isBound(n) {
  return n % 2 === 0;
}

const visibleCourses = computed(() =>
  courses.value.filter((c) => c.startWeek <= week.value && week.value <= c.endWeek)
);

function dayCourses(d) {
  return visibleCourses.value.filter((c) => c.weekDay === d);
}

function cardStyle(c) {
  const color = courseColor(c.colorIndex);
  return {
    top: (c.startSection - 1) * SLOT_H + 2 + "px",
    height: (c.endSection - c.startSection + 1) * SLOT_H - 4 + "px",
    background: color.bg,
    borderLeft: "3px solid " + color.fg
  };
}

function applyWeek() {
  // 周次切换仅前端过滤，无需重新请求
}

function showCourse(c) {
  ElMessageBox.alert(
    "课程代码：" + c.courseCode +
      "\n授课教师：" + c.teacher +
      "\n学分：" + c.credit +
      "\n上课周次：第 " + c.startWeek + "-" + c.endWeek + " 周" +
      "\n上课地点：" + c.location,
    c.courseName,
    { confirmButtonText: "知道了" }
  );
}

async function load() {
  try {
    const d = await eduApi.schedule(semester.value);
    semesters.value = d.semesters || [];
    if (!semester.value) semester.value = d.semester;
    courses.value = d.courses || [];
  } catch (e) {}
}

onMounted(load);
</script>

<style scoped>
.page-title {
  margin: 0;
  font-size: 24px;
}
.sch-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 8px;
}
.sch-controls {
  display: flex;
  gap: 8px;
}
.sch-board {
  padding: 0;
  overflow: hidden;
}
.sch-row {
  display: flex;
}
.sch-head-row {
  background: #faf5ef;
  border-bottom: 1px solid #eee4d9;
  font-weight: 600;
  font-size: 14px;
}
.sch-time-cell {
  width: 56px;
  flex-shrink: 0;
  padding: 10px 0;
  text-align: center;
  color: var(--text-sub);
}
.sch-day-cell {
  flex: 1;
  text-align: center;
  padding: 10px 0;
}
.sch-grid {
  display: flex;
  position: relative;
}
.sch-axis {
  width: 56px;
  flex-shrink: 0;
  position: relative;
}
.sch-slot {
  height: 56px;
  border-bottom: 1px solid #f6efe7;
  display: flex;
  align-items: flex-start;
  justify-content: center;
}
.sch-axis .sch-slot {
  position: relative;
}
.sch-axis .sch-slot:last-child {
  border-bottom: none;
}
.slot-bound {
  border-bottom: 1px solid #eee4d9 !important;
}
.slot-label {
  font-size: 11px;
  color: #b3a89c;
  margin-top: 4px;
}
.sch-col {
  flex: 1;
  position: relative;
  border-left: 1px solid #f6efe7;
}
.sch-col .sch-slot:last-child {
  border-bottom: none;
}
.course-card {
  position: absolute;
  left: 3px;
  right: 3px;
  border-radius: 6px;
  padding: 6px 8px;
  cursor: pointer;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(139, 126, 112, 0.12);
  transition: box-shadow 0.15s;
}
.course-card:hover {
  box-shadow: 0 4px 12px rgba(139, 126, 112, 0.25);
}
.course-name {
  font-size: 13px;
  font-weight: 700;
  line-height: 1.3;
}
.course-loc {
  font-size: 11px;
  color: #8a7f73;
  margin-top: 3px;
}
</style>
