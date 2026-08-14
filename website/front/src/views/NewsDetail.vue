<template>
  <div class="page narrow" v-if="news">
    <div class="ui-card detail-card">
      <h1 class="news-title">{{ news.title }}</h1>
      <div class="news-meta">
        <el-tag size="small" effect="plain">{{ news.category }}</el-tag>
        <span class="meta-text">发布时间：{{ dateText(news.publishedAt) }}</span>
        <span class="meta-text">阅读量：{{ news.views }}</span>
      </div>
      <div v-if="news.summary" class="news-summary">{{ news.summary }}</div>
      <div class="news-body">
        <div v-for="(p, i) in news.content" :key="i" class="news-para">
          <div v-if="p.h" class="para-h">{{ p.h }}</div>
          <div class="para-p">{{ p.p }}</div>
        </div>
      </div>
      <div class="news-foot">
        <el-button @click="$router.back()">返回列表</el-button>
        <span class="source-text">来源：{{ news.sourceUrl ? "学校官网" : "学校官网（演示数据）" }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import { ElMessage } from "element-plus";
import { newsApi } from "../api/news";

const route = useRoute();
const news = ref(null);

function dateText(iso) {
  const d = new Date(iso);
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

onMounted(async () => {
  try {
    const d = await newsApi.detail(route.params.id);
    news.value = d;
  } catch (e) {
    if (e.code === 40401) ElMessage.error("资讯不存在");
  }
});
</script>

<style scoped>
.narrow {
  max-width: 860px;
}
.detail-card {
  padding: 32px;
}
.news-title {
  margin: 0;
  font-size: 24px;
  line-height: 1.4;
}
.news-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 12px;
  padding-bottom: 16px;
  border-bottom: 1px dashed #eee4d9;
}
.meta-text {
  font-size: 13px;
  color: var(--text-sub);
}
.news-summary {
  margin-top: 16px;
  padding: 12px 16px;
  background: var(--el-color-primary-light-9);
  border-radius: 6px;
  font-size: 14px;
  color: #6b5f54;
}
.news-body {
  margin-top: 16px;
}
.news-para {
  margin-bottom: 16px;
}
.para-h {
  font-weight: 600;
  margin-bottom: 6px;
}
.para-p {
  line-height: 1.8;
  color: #4a4038;
}
.news-foot {
  margin-top: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.source-text {
  font-size: 12px;
  color: #b3a89c;
}
</style>
