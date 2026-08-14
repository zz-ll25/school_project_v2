<template>
  <div class="page narrow">
    <div class="search-bar">
      <el-input v-model="keyword" placeholder="输入关键词，空格分隔实现 AND 搜索" size="large"
        clearable @keyup.enter="doSearch">
        <template #append>
          <el-button :icon="Search" :loading="loading" @click="doSearch">搜索</el-button>
        </template>
      </el-input>
    </div>

    <template v-if="searched">
      <div class="result-count" v-if="results.length">
        共 {{ results.length }} 条结果
      </div>
      <div v-for="r in results" :key="r.item.id" class="ui-card result-item"
        @click="$router.push('/guide/' + r.item.id)">
        <div class="result-icon">{{ r.item.icon }}</div>
        <div class="result-body">
          <div class="result-title">
            <SearchHighlight :segs="r.titleSegs" />
            <span class="result-col">{{ r.colLabel }}</span>
            <DemoBadge :show="r.item.demo" />
          </div>
          <div class="result-summary">
            <SearchHighlight :segs="r.summarySegs" />
          </div>
        </div>
        <div class="result-arrow">›</div>
      </div>
      <EmptyState v-if="searched && !results.length" icon="🔍" title="没有找到相关内容"
        desc="换个关键词试试，例如「报到」「宿舍」「选课」" />
    </template>
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import { Search } from "@element-plus/icons-vue";
import { guideApi } from "../api/guide";
import SearchHighlight from "../components/SearchHighlight.vue";
import DemoBadge from "../components/DemoBadge.vue";
import EmptyState from "../components/EmptyState.vue";

const route = useRoute();
const keyword = ref("");
const results = ref([]);
const loading = ref(false);
const searched = ref(false);

async function doSearch() {
  const q = keyword.value.trim();
  if (!q) return;
  loading.value = true;
  try {
    const d = await guideApi.search(q);
    results.value = d.results || [];
    searched.value = true;
  } catch (e) {
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  if (route.query.q) {
    keyword.value = String(route.query.q);
    doSearch();
  }
});
</script>

<style scoped>
.narrow {
  max-width: 860px;
}
.search-bar {
  margin-bottom: 16px;
}
.result-count {
  font-size: 13px;
  color: var(--text-sub);
  margin-bottom: 8px;
}
.result-item {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 12px;
  cursor: pointer;
}
.result-icon {
  font-size: 26px;
}
.result-body {
  flex: 1;
}
.result-title {
  font-weight: 600;
}
.result-col {
  font-size: 12px;
  color: var(--text-sub);
  border: 1px solid #eee4d9;
  border-radius: 4px;
  padding: 0 6px;
  margin-left: 8px;
}
.result-summary {
  font-size: 13px;
  color: var(--text-sub);
  margin-top: 4px;
}
.result-arrow {
  color: var(--text-sub);
}
</style>
