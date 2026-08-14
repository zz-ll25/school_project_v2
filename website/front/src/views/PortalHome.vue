<template>
  <div class="page">
    <!-- Banner -->
    <div class="ui-card banner">
      <div class="banner-text">
        <h1 class="banner-title">{{ school ? school.name : "电子科技大学成都学院" }}</h1>
        <p class="banner-slogan">{{ school ? school.slogan : "" }}</p>
      </div>
      <div class="banner-emoji">🏫</div>
    </div>

    <!-- 功能入口宫格 -->
    <div class="grid">
      <div v-for="g in entries" :key="g.path" class="ui-card grid-item" @click="$router.push(g.path)">
        <div class="grid-icon">{{ g.icon }}</div>
        <div class="grid-label">{{ g.label }}</div>
        <div class="grid-sub">{{ g.sub }}</div>
      </div>
    </div>

    <!-- 热门指南 -->
    <div class="ui-section-title" style="margin-top: 8px">📌 新生必看</div>
    <div class="hot-list">
      <div v-for="item in hotItems" :key="item.id" class="ui-card hot-item"
        @click="$router.push('/guide/' + item.id)">
        <span class="hot-icon">{{ item.icon }}</span>
        <span class="hot-title">{{ item.title }}</span>
        <span class="hot-summary">{{ item.summary }}</span>
        <span class="hot-arrow">›</span>
      </div>
    </div>

    <!-- 校区位置 -->
    <div class="ui-section-title" style="margin-top: 16px">📍 校区位置</div>
    <div class="campus-row">
      <div v-for="cp in campuses" :key="cp.name" class="ui-card campus-card">
        <div class="campus-name">{{ cp.name }}</div>
        <div class="campus-addr">{{ cp.addr }}</div>
        <a class="campus-link" :href="mapUri(cp)" target="_blank">打开地图 ›</a>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { guideApi } from "../api/guide";

const school = ref(null);
const collections = ref([]);
const campuses = ref([]);

const entries = [
  { path: "/guide", icon: "🧭", label: "新生导航", sub: "报到 · 宿舍 · 选课" },
  { path: "/edu", icon: "📚", label: "教务系统", sub: "课表 · 成绩 · 考试" },
  { path: "/news", icon: "📰", label: "校园资讯", sub: "通知 · 新闻 · 动态" },
  { path: "/assistant", icon: "🤖", label: "AI 助手", sub: "入学问题智能答疑" }
];

const hotItems = computed(() => {
  const guide = collections.value.find((c) => c.key === "guide");
  return guide ? guide.items.slice(0, 6) : [];
});

function mapUri(cp) {
  return "https://uri.amap.com/marker?position=" + cp.longitude + "," + cp.latitude + "&name=" + encodeURIComponent(cp.name);
}

onMounted(async () => {
  try {
    const s = await guideApi.school();
    school.value = s;
    campuses.value = (s && s.campuses) || [];
  } catch (e) {}
  try {
    const c = await guideApi.collections();
    collections.value = c.collections || [];
  } catch (e) {}
});
</script>

<style scoped>
.banner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 36px 32px;
  background: linear-gradient(120deg, #fff, var(--el-color-primary-light-9));
}
.banner-title {
  margin: 0;
  font-size: 26px;
}
.banner-slogan {
  margin: 8px 0 0;
  color: var(--text-sub);
}
.banner-emoji {
  font-size: 56px;
}
.grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-top: 16px;
}
.grid-item {
  text-align: center;
  cursor: pointer;
  transition: transform 0.15s;
  padding: 24px 12px;
}
.grid-item:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 16px rgba(139, 126, 112, 0.15);
}
.grid-icon {
  font-size: 32px;
}
.grid-label {
  font-size: 16px;
  font-weight: 600;
  margin-top: 8px;
}
.grid-sub {
  font-size: 12px;
  color: var(--text-sub);
  margin-top: 4px;
}
.hot-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}
.hot-item {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  padding: 14px 16px;
}
.hot-item:hover {
  border-color: var(--el-color-primary-light-5);
}
.hot-icon {
  font-size: 20px;
}
.hot-title {
  font-weight: 600;
  white-space: nowrap;
}
.hot-summary {
  flex: 1;
  font-size: 13px;
  color: var(--text-sub);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.hot-arrow {
  color: var(--text-sub);
}
.campus-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}
.campus-name {
  font-weight: 600;
  font-size: 15px;
}
.campus-addr {
  font-size: 13px;
  color: var(--text-sub);
  margin-top: 4px;
}
.campus-link {
  display: inline-block;
  margin-top: 8px;
  font-size: 13px;
  color: var(--el-color-primary);
  text-decoration: none;
}
@media (max-width: 768px) {
  .grid { grid-template-columns: repeat(2, 1fr); }
  .hot-list, .campus-row { grid-template-columns: 1fr; }
}
</style>
