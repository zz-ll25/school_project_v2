<template>
  <span v-if="show" class="demo-badge">示例</span>
</template>

<script setup>
defineProps({
  show: { type: Boolean, default: false }
});
</script>
