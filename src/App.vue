<script setup lang="ts">
import { ref } from 'vue';

const count = ref(0);

window.osc.onUpdateDeathCount((deathCount) => {
  count.value = deathCount;
});
</script>

<template>
  <!-- TODO: マジックナンバー解消 -->
  <p>死：{{ count }}</p>
  <p>プランク：{{ count * 5 }}秒</p>
  <p>ワイドスクワット：{{ count * 2 }}回</p>
</template>

<style scoped>
</style>
