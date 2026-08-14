<template>
  <div class="empty-state">
    <div class="empty-icon">{{ icon }}</div>
    <div class="empty-title">{{ title }}</div>
    <div v-if="desc" class="empty-desc">{{ desc }}</div>
    <div class="empty-action"><slot name="action" /></div>
  </div>
</template>

<script setup>
defineProps({
  icon: { type: String, default: "🗂️" },
  title: { type: String, default: "暂无内容" },
  desc: { type: String, default: "" }
});
</script>

<style scoped>
.empty-state {
  text-align: center;
  padding: 48px 16px;
  color: var(--text-sub);
}
.empty-icon {
  font-size: 40px;
  margin-bottom: 8px;
}
.empty-title {
  font-size: 15px;
  color: var(--text-main);
}
.empty-desc {
  font-size: 13px;
  margin-top: 6px;
}
.empty-action {
  margin-top: 16px;
}
</style>
