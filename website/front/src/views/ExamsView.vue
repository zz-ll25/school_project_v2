<template>
  <div class="page narrow">
    <h1 class="page-title">考试安排</h1>
    <p class="page-sub">本学期期末考试（{{ semesterLabel }}）</p>

    <div v-for="group in groupedExams" :key="group.date" class="exam-group">
      <div class="exam-date-row">
        <span class="exam-date">{{ group.dateLabel }}</span>
        <el-tag v-if="group.daysLeft >= 0" :type="group.daysLeft <= 3 ? 'danger' : 'warning'" size="small">
          还有 {{ group.daysLeft }} 天
        </el-tag>
        <el-tag v-else type="info" size="small">已结束</el-tag>
      </div>
      <div class="ui-card exam-item" v-for="e in group.exams" :key="e.name">
        <div class="exam-icon">📝</div>
        <div class="exam-body">
          <div class="exam-name">{{ e.courseName }} · {{ e.name }}</div>
          <div class="exam-meta">
            🕐 {{ e.startTime }}—{{ e.endTime }} · 📍 {{ e.location }} · 💺 座位号 {{ e.seatNo }}
          </div>
        </div>
      </div>
    </div>

    <EmptyState v-if="!exams.length" icon="📝" title="暂无考试安排" />
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { eduApi } from "../api/edu";
import EmptyState from "../components/EmptyState.vue";

const exams = ref([]);
const semesterLabel = ref("");

// 后端 examDate 是 ISO 字符串（UTC），本地化后按日期分组
function localDate(iso) {
  const d = new Date(iso);
  return {
    date: d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"),
    time: String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0"),
    daysLeft: Math.ceil((d.getTime() - Date.now()) / (24 * 3600 * 1000))
  };
}

const groupedExams = computed(() => {
  const map = {};
  exams.value.forEach((e) => {
    const d = localDate(e.examDate);
    const key = d.date;
    if (!map[key]) map[key] = { date: key, dateLabel: key, daysLeft: d.daysLeft, exams: [] };
    map[key].exams.push({ ...e, startTime: d.time, endTime: d.time });
  });
  return Object.values(map);
});

onMounted(async () => {
  try {
    const d = await eduApi.exams();
    exams.value = d.exams || [];
    if (exams.value.length) semesterLabel.value = exams.value[0].semester || "";
  } catch (e) {}
});
</script>

<style scoped>
.narrow {
  max-width: 860px;
}
.page-title {
  margin: 0;
  font-size: 24px;
}
.page-sub {
  margin: 6px 0 20px;
  color: var(--text-sub);
  font-size: 13px;
}
.exam-group {
  margin-bottom: 20px;
}
.exam-date-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}
.exam-date {
  font-weight: 700;
}
.exam-item {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 10px;
}
.exam-icon {
  font-size: 24px;
}
.exam-name {
  font-weight: 600;
}
.exam-meta {
  font-size: 13px;
  color: var(--text-sub);
  margin-top: 4px;
}
</style>
