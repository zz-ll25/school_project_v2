<template>
  <div class="page narrow">
    <h1 class="page-title">我的申请</h1>

    <div v-for="a in list" :key="a.id" class="ui-card app-item">
      <div class="app-main">
        <div class="app-title-row">
          <span class="app-title">{{ a.formTitle }}</span>
          <span class="app-time">{{ timeText(a.submittedAt) }}</span>
        </div>
        <div class="app-values">
          <el-tag v-for="(v, k) in labelValues(a)" :key="k" size="small" effect="plain" style="margin-right: 8px">
            {{ v }}
          </el-tag>
        </div>
      </div>
      <el-button text type="danger" size="small" @click="onRemove(a)">删除</el-button>
    </div>

    <EmptyState v-if="loaded && !list.length" icon="📄" title="还没有申请记录" desc="在表单类指南页面可在线提交申请" />
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { appApi } from "../api/user";
import EmptyState from "../components/EmptyState.vue";

const list = ref([]);
const loaded = ref(false);

function timeText(iso) {
  const d = new Date(iso);
  const p = (n) => String(n).padStart(2, "0");
  return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate()) + " " + p(d.getHours()) + ":" + p(d.getMinutes());
}

// 展示值标签（最多 4 个）
function labelValues(a) {
  const vals = a.values || {};
  return Object.keys(vals).slice(0, 4).map((k) => k + ": " + vals[k]);
}

async function load() {
  try {
    const d = await appApi.list();
    list.value = d.list || [];
  } catch (e) {
  } finally {
    loaded.value = true;
  }
}

async function onRemove(a) {
  await ElMessageBox.confirm("删除这条申请记录？", "删除", { confirmButtonText: "删除", type: "warning" });
  try {
    await appApi.remove(a.id);
    list.value = list.value.filter((i) => i.id !== a.id);
    ElMessage.success("已删除");
  } catch (e) {}
}

onMounted(load);
</script>

<style scoped>
.narrow {
  max-width: 860px;
}
.page-title {
  margin: 0 0 16px;
  font-size: 24px;
}
.app-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}
.app-main {
  flex: 1;
}
.app-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.app-title {
  font-weight: 600;
}
.app-time {
  font-size: 12px;
  color: #b3a89c;
}
.app-values {
  margin-top: 8px;
}
</style>
