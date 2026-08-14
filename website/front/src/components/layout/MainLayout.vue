<template>
  <div class="layout">
    <header class="topbar">
      <div class="topbar-inner">
        <router-link to="/" class="brand">
          <span class="brand-logo">🎓</span>
          <span class="brand-name">成电校园门户</span>
        </router-link>
        <nav class="menu">
          <router-link v-for="m in menus" :key="m.path" :to="m.path" class="menu-item"
            :class="{ active: isActive(m) }">
            {{ m.label }}
          </router-link>
        </nav>
        <div class="user-box">
          <template v-if="auth.isLoggedIn && auth.student">
            <el-dropdown @command="onUserCommand">
              <span class="user-chip">
                <span class="user-avatar">{{ (auth.student.name || "?").slice(0, 1) }}</span>
                <span class="user-name">{{ auth.student.name }}</span>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="edu">教务系统</el-dropdown-item>
                  <el-dropdown-item command="profile">个人信息</el-dropdown-item>
                  <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
          <el-button v-else type="primary" size="small" @click="goLogin">登录</el-button>
        </div>
      </div>
    </header>

    <main class="main">
      <router-view />
    </main>

    <footer class="footer">
      电子科技大学成都学院 · 校园门户（演示版）— 数据均为示例内容，请以学校官方通知为准
    </footer>
  </div>
</template>

<script setup>
import { onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import { useAuthStore } from "../../stores/auth";
import { authApi } from "../../api/auth";

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();

const menus = [
  { path: "/", label: "首页" },
  { path: "/guide", label: "新生导航" },
  { path: "/news", label: "校园资讯" },
  { path: "/assistant", label: "AI 助手" },
  { path: "/edu", label: "教务系统" }
];

function isActive(m) {
  if (m.path === "/") return route.path === "/";
  return route.path.indexOf(m.path) === 0;
}

function goLogin() {
  router.push({ path: "/login", query: { redirect: route.fullPath } });
}

async function onUserCommand(cmd) {
  if (cmd === "edu") router.push("/edu");
  else if (cmd === "profile") router.push("/profile");
  else if (cmd === "logout") {
    await ElMessageBox.confirm("确定退出登录吗？", "退出登录", { confirmButtonText: "退出", type: "warning" });
    try { await authApi.logout(); } catch (e) {}
    auth.logout();
    ElMessage.success("已退出登录");
    if (route.meta && route.meta.requiresAuth) router.push("/");
  }
}

onMounted(() => {
  auth.fetchMe();
});
</script>

<style scoped>
.layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
.topbar {
  background: #fff;
  border-bottom: 1px solid #f0e8de;
  position: sticky;
  top: 0;
  z-index: 100;
}
.topbar-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 16px;
  height: 56px;
  display: flex;
  align-items: center;
  gap: 24px;
}
.brand {
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  color: var(--text-main);
  font-weight: 700;
  font-size: 16px;
  white-space: nowrap;
}
.brand-logo {
  font-size: 22px;
}
.menu {
  display: flex;
  gap: 4px;
  flex: 1;
}
.menu-item {
  padding: 6px 12px;
  border-radius: 6px;
  text-decoration: none;
  color: var(--text-sub);
  font-size: 14px;
  white-space: nowrap;
}
.menu-item:hover {
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}
.menu-item.active {
  color: var(--el-color-primary);
  font-weight: 600;
}
.user-box {
  display: flex;
  align-items: center;
}
.user-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  outline: none;
}
.user-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--el-color-primary-light-7);
  color: var(--el-color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
}
.user-name {
  font-size: 14px;
  color: var(--text-main);
}
.main {
  flex: 1;
}
.footer {
  text-align: center;
  padding: 20px;
  font-size: 12px;
  color: var(--text-sub);
  border-top: 1px solid #f0e8de;
  background: #fff;
}
</style>
