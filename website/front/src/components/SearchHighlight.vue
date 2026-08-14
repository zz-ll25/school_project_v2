<template>
  <span><span v-for="(seg, i) in segs" :key="i" :class="{ 'hl-seg': seg.hl }">{{ seg.t }}</span></span>
</template>

<script setup>
// 渲染搜索高亮段：segs = [{t, hl}]（后端 segments() 输出）
defineProps({
  segs: { type: Array, default: () => [] }
});
</script>

<style scoped>
.hl-seg {
  color: var(--el-color-primary);
  font-weight: 600;
}
</style>
