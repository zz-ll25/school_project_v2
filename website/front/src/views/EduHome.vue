<template>
  <div class="page narrow">
    <!-- 学生信息卡 -->
    <div class="ui-card stu-card">
      <div class="stu-avatar">{{ avatarText }}</div>
      <div class="stu-info">
        <div class="stu-name">
          {{ student ? student.name : "—" }}
          <span class="demo-badge">演示数据</span>
        </div>
        <div class="stu-meta" v-if="student">
          {{ student.studentNo }} · {{ student.major }} {{ student.className }} · {{ student.grade }} 级
        </div>
      </div>
    </div>

    <!-- 功能入口 -->
    <div class="edu-grid">
      <div v-for="g in entries" :key="g.path" class="ui-card edu-item" @click="$router.push(g.path)">
        <div class="edu-icon">{{ g.icon }}</div>
        <div class="edu-label">{{ g.label }}</div>
        <div class="edu-sub">{{ g.sub }}</div>
      </div>
    </div>

    <div class="logout-box">
      <el-button plain type="danger" @click="onLogout">退出登录</el-button>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import { eduApi } from "../api/edu";
import { authApi } from "../api/auth";
import { useAuthStore } from "../stores/auth";

const router = useRouter();
const auth = useAuthStore();
const student = ref(null);

const avatarText = computed(() => (student.value && student.value.name ? student.value.name.slice(0, 1) : "?"));

const entries = [
  { path: "/edu/schedule", icon: "🗓️", label: "周课表", sub: "本学期课程安排" },
  { path: "/edu/grades", icon: "📊", label: "成绩查询", sub: "学期成绩与 GPA" },
  { path: "/edu/exams", icon: "📝", label: "考试安排", sub: "时间地点倒计时" },
  { path: "/news", icon: "📰", label: "校园资讯", sub: "通知公告与新闻" }
];

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
  max-width: 860px;
}
.stu-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 24px;
}
.stu-avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--el-color-primary-light-7);
  color: var(--el-color-primary);
  font-size: 26px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
}
.stu-name {
  font-size: 20px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 8px;
}
.stu-meta {
  font-size: 13px;
  color: var(--text-sub);
  margin-top: 6px;
}
.edu-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-top: 16px;
}
.edu-item {
  text-align: center;
  padding: 24px 12px;
  cursor: pointer;
  transition: transform 0.15s;
}
.edu-item:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 16px rgba(139, 126, 112, 0.15);
}
.edu-icon {
  font-size: 32px;
}
.edu-label {
  font-weight: 600;
  margin-top: 8px;
}
.edu-sub {
  font-size: 12px;
  color: var(--text-sub);
  margin-top: 4px;
}
.logout-box {
  text-align: center;
  margin-top: 24px;
}
@media (max-width: 768px) {
  .edu-grid { grid-template-columns: repeat(2, 1fr); }
}
</style>
