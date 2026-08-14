<template>
  <div class="page narrow">
    <h1 class="page-title">我的收藏</h1>

    <div v-for="f in items" :key="f.itemId" class="ui-card fav-item">
      <div class="fav-main" @click="$router.push('/guide/' + f.itemId)">
        <span class="fav-icon">{{ f.icon }}</span>
        <div class="fav-body">
          <div class="fav-title">
            {{ f.title }}
            <DemoBadge :show="f.demo" />
          </div>
          <div class="fav-summary">{{ f.summary }}</div>
        </div>
        <span class="fav-arrow">›</span>
      </div>
      <el-button text type="danger" size="small" @click="onRemove(f)">取消收藏</el-button>
    </div>

    <EmptyState v-if="loaded && !items.length" icon="⭐" title="还没有收藏" desc="在指南详情页点击 ⭐ 即可收藏" />
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { ElMessage } from "element-plus";
import { favApi } from "../api/user";
import DemoBadge from "../components/DemoBadge.vue";
import EmptyState from "../components/EmptyState.vue";

const items = ref([]);
const loaded = ref(false);

async function load() {
  try {
    const d = await favApi.list();
    items.value = d.items || [];
  } catch (e) {
  } finally {
    loaded.value = true;
  }
}

async function onRemove(f) {
  try {
    await favApi.remove(f.itemId);
    items.value = items.value.filter((i) => i.itemId !== f.itemId);
    ElMessage.success("已取消收藏");
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
.fav-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}
.fav-main {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
}
.fav-icon {
  font-size: 24px;
}
.fav-body {
  flex: 1;
}
.fav-title {
  font-weight: 600;
}
.fav-summary {
  font-size: 13px;
  color: var(--text-sub);
  margin-top: 4px;
}
.fav-arrow {
  color: var(--text-sub);
}
</style>
