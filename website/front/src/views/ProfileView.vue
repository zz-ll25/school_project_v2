<template>
  <div class="page narrow">
    <h1 class="page-title">个人信息</h1>

    <div class="ui-card profile-card">
      <div class="profile-row" v-for="row in infoRows" :key="row.label">
        <span class="profile-label">{{ row.label }}</span>
        <span class="profile-value">{{ row.value }}</span>
      </div>
    </div>

    <div class="ui-card danger-card">
      <div class="card-title">数据管理</div>
      <div class="danger-row">
        <div>
          <div class="danger-name">清空我的数据</div>
          <div class="danger-desc">删除收藏、清单勾选与申请记录（不影响学籍数据）</div>
        </div>
        <el-button type="danger" plain @click="onClearData">清空</el-button>
      </div>
      <div class="danger-row">
        <div>
          <div class="danger-name">退出登录</div>
          <div class="danger-desc">退出当前账号</div>
        </div>
        <el-button type="danger" plain @click="onLogout">退出</el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import { eduApi } from "../api/edu";
import { authApi } from "../api/auth";
import { appApi } from "../api/user";
import { useAuthStore } from "../stores/auth";

const router = useRouter();
const auth = useAuthStore();
const student = ref(null);

const infoRows = computed(() => {
  if (!student.value) return [];
  return [
    { label: "姓名", value: student.value.name },
    { label: "学号", value: student.value.studentNo },
    { label: "专业", value: student.value.major },
    { label: "班级", value: student.value.className },
    { label: "年级", value: student.value.grade + " 级" }
  ];
});

async function onClearData() {
  await ElMessageBox.confirm("将删除收藏、清单勾选与申请记录，确定吗？", "清空数据", { confirmButtonText: "清空", type: "warning" });
  try {
    await appApi.clearData();
    ElMessage.success("已清空");
  } catch (e) {}
}

async function onLogout() {
  await ElMessageBox.confirm("确定退出登录吗？", "退出登录", { confirmButtonText: "退出", type: "warning" });
  try { await authApi.logout(); } catch (e) {}
  auth.logout();
  ElMessage.success("已退出登录");
  router.push("/");
}

onMounted(async () => {
  try {
    student.value = await eduApi.student();
  } catch (e) {}
});
</script>

<style scoped>
.narrow {
  max-width: 700px;
}
.page-title {
  margin: 0 0 16px;
  font-size: 24px;
}
.profile-card {
  padding: 8px 20px;
}
.profile-row {
  display: flex;
  padding: 14px 0;
  border-bottom: 1px dashed #f0e8de;
}
.profile-row:last-child {
  border-bottom: none;
}
.profile-label {
  width: 100px;
  color: var(--text-sub);
  font-size: 14px;
}
.profile-value {
  font-weight: 600;
  font-size: 14px;
}
.danger-card {
  margin-top: 16px;
}
.card-title {
  font-weight: 600;
  margin-bottom: 8px;
}
.danger-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px dashed #f0e8de;
}
.danger-row:last-child {
  border-bottom: none;
}
.danger-name {
  font-size: 14px;
  font-weight: 600;
}
.danger-desc {
  font-size: 12px;
  color: var(--text-sub);
  margin-top: 4px;
}
</style>
