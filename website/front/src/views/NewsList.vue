<template>
  <div class="page narrow">
    <h1 class="page-title">校园资讯</h1>

    <el-tabs v-model="category" @tab-change="onTabChange">
      <el-tab-pane v-for="c in categories" :key="c.value" :label="c.label" :name="c.value" />
    </el-tabs>

    <div v-for="n in list" :key="n.id" class="ui-card news-item" @click="$router.push('/news/' + n.id)">
      <div class="news-left">
        <div class="news-title">
          <el-tag v-if="n.isTop" type="danger" size="small" style="margin-right: 8px">置顶</el-tag>
          {{ n.title }}
        </div>
        <div class="news-summary">{{ n.summary }}</div>
        <div class="news-meta">
          <el-tag size="small" effect="plain">{{ n.category }}</el-tag>
          <span class="meta-text">{{ dateText(n.publishedAt) }}</span>
          <span class="meta-text">👁 {{ n.views }}</span>
        </div>
      </div>
      <div class="news-arrow">›</div>
    </div>

    <div class="pager" v-if="total > pageSize">
      <el-pagination background layout="prev, pager, next" :total="total"
        :page-size="pageSize" :current-page="page" @current-change="onPageChange" />
    </div>

    <EmptyState v-if="loaded && !list.length" icon="📰" title="暂无资讯" />
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { newsApi } from "../api/news";
import EmptyState from "../components/EmptyState.vue";

const categories = [
  { label: "全部", value: "" },
  { label: "通知公告", value: "通知公告" },
  { label: "学校新闻", value: "学校新闻" },
  { label: "教务动态", value: "教务动态" }
];

const category = ref("");
const list = ref([]);
const total = ref(0);
const page = ref(1);
const pageSize = 10;
const loaded = ref(false);

function dateText(iso) {
  const d = new Date(iso);
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

async function load() {
  loaded.value = false;
  try {
    const d = await newsApi.list({ category: category.value, page: page.value, pageSize });
    list.value = d.list || [];
    total.value = d.total;
  } catch (e) {
  } finally {
    loaded.value = true;
  }
}

function onTabChange() {
  page.value = 1;
  load();
}

function onPageChange(p) {
  page.value = p;
  load();
}

onMounted(load);
</script>

<style scoped>
.narrow {
  max-width: 860px;
}
.page-title {
  margin: 0 0 8px;
  font-size: 24px;
}
.news-item {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  cursor: pointer;
  transition: transform 0.15s;
}
.news-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(139, 126, 112, 0.15);
}
.news-left {
  flex: 1;
}
.news-title {
  font-weight: 600;
  font-size: 15px;
}
.news-summary {
  font-size: 13px;
  color: var(--text-sub);
  margin-top: 6px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.news-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 8px;
}
.meta-text {
  font-size: 12px;
  color: #b3a89c;
}
.news-arrow {
  color: var(--text-sub);
  font-size: 18px;
}
.pager {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}
</style>
