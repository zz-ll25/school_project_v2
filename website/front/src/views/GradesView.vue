<template>
  <div class="page narrow">
    <div class="grade-head">
      <h1 class="page-title">成绩查询</h1>
      <el-select v-model="semester" style="width: 180px" @change="load">
        <el-option v-for="s in semesters" :key="s" :label="s" :value="s" />
      </el-select>
    </div>

    <!-- 统计卡 -->
    <div v-if="stats" class="stats-row">
      <div class="ui-card stat-card">
        <div class="stat-value">{{ stats.weightedGpa }}</div>
        <div class="stat-label">加权平均绩点</div>
      </div>
      <div class="ui-card stat-card">
        <div class="stat-value">{{ stats.avgScore }}</div>
        <div class="stat-label">加权平均分</div>
      </div>
      <div class="ui-card stat-card">
        <div class="stat-value">{{ stats.totalCredits }}</div>
        <div class="stat-label">已获学分</div>
      </div>
    </div>

    <!-- 成绩表 -->
    <div v-if="grades.length" class="ui-card">
      <el-table :data="grades" stripe>
        <el-table-column prop="courseName" label="课程" min-width="140" />
        <el-table-column prop="credit" label="学分" width="70" align="center" />
        <el-table-column label="成绩" width="110" align="center">
          <template #default="{ row }">
            <span :class="{ 'score-fail': row.isResit && row.resitScore === null ? row.score < 60 : (row.isResit ? row.resitScore < 60 : row.score < 60) }">
              {{ displayScore(row) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="绩点" width="80" align="center">
          <template #default="{ row }">{{ row.gpaPoints.toFixed(1) }}</template>
        </el-table-column>
        <el-table-column label="备注" width="110" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.isResit" type="warning" size="small">补考</el-tag>
            <el-tag v-else-if="row.score >= 90" type="success" size="small">优秀</el-tag>
            <span v-else class="no-tag">正常</span>
          </template>
        </el-table-column>
      </el-table>
    </div>
    <EmptyState v-else icon="📊" title="本学期暂无成绩" desc="新生首学期成绩通常在期末后发布" />
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { eduApi } from "../api/edu";
import EmptyState from "../components/EmptyState.vue";

const semester = ref("");
const semesters = ref([]);
const grades = ref([]);
const stats = ref(null);

function displayScore(row) {
  if (row.isResit) {
    return row.resitScore !== null ? row.resitScore + "（补考）" : row.score + "（待补考）";
  }
  return String(row.score);
}

async function load() {
  try {
    const d = await eduApi.grades(semester.value);
    semesters.value = d.semesters || [];
    if (!semester.value) semester.value = d.semester;
    grades.value = d.grades || [];
    stats.value = d.stats;
  } catch (e) {}
}

onMounted(load);
</script>

<style scoped>
.narrow {
  max-width: 900px;
}
.page-title {
  margin: 0;
  font-size: 24px;
}
.grade-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 8px;
}
.stats-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 16px;
}
.stat-card {
  text-align: center;
  padding: 20px;
}
.stat-value {
  font-size: 30px;
  font-weight: 700;
  color: var(--el-color-primary);
}
.stat-label {
  font-size: 13px;
  color: var(--text-sub);
  margin-top: 6px;
}
.score-fail {
  color: var(--danger);
  font-weight: 700;
}
.no-tag {
  font-size: 13px;
  color: var(--text-sub);
}
</style>
