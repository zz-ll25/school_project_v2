<template>
  <div class="page">
    <div class="guide-head">
      <h1 class="page-title">新生导航</h1>
      <el-input v-model="keyword" placeholder="搜索指南，如「报到 宿舍」" class="search-input"
        clearable @keyup.enter="doSearch" @clear="keyword = ''">
        <template #append>
          <el-button :icon="Search" @click="doSearch" />
        </template>
      </el-input>
    </div>

    <template v-if="collections.length">
      <div v-for="col in collections" :key="col.key" class="group">
        <div class="ui-section-title">{{ groupIcon(col.key) }} {{ col.label }}</div>
        <div class="item-grid">
          <div v-for="item in col.items" :key="item.id" class="ui-card item-card"
            @click="$router.push('/guide/' + item.id)">
            <div class="item-icon">{{ item.icon }}</div>
            <div class="item-title">
              {{ item.title }}
              <DemoBadge :show="item.demo" />
            </div>
            <div class="item-summary">{{ item.summary }}</div>
          </div>
        </div>
      </div>
    </template>
    <EmptyState v-else icon="📭" title="内容加载中" />
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { Search } from "@element-plus/icons-vue";
import { guideApi } from "../api/guide";
import DemoBadge from "../components/DemoBadge.vue";
import EmptyState from "../components/EmptyState.vue";

const router = useRouter();
const keyword = ref("");
const collections = ref([]);

function groupIcon(key) {
  return { guide: "🧭", services: "🛠️", tour: "🏞️" }[key] || "📄";
}

function doSearch() {
  const q = keyword.value.trim();
  if (q) router.push({ path: "/search", query: { q } });
}

onMounted(async () => {
  try {
    const c = await guideApi.collections();
    collections.value = c.collections || [];
  } catch (e) {}
});
</script>

<style scoped>
.page-title {
  margin: 0;
  font-size: 24px;
}
.guide-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}
.search-input {
  width: 320px;
}
.group {
  margin-top: 20px;
}
.item-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}
.item-card {
  cursor: pointer;
  padding: 16px;
  transition: transform 0.15s;
}
.item-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(139, 126, 112, 0.15);
}
.item-icon {
  font-size: 24px;
}
.item-title {
  font-weight: 600;
  margin-top: 8px;
}
.item-summary {
  font-size: 13px;
  color: var(--text-sub);
  margin-top: 4px;
}
@media (max-width: 768px) {
  .item-grid { grid-template-columns: 1fr; }
  .search-input { width: 100%; }
}
</style>
