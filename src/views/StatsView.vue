<script setup lang="ts">
import { ref, computed } from 'vue';
import type { StatsMap } from '../../common/types';
import ViewHeading from '../components/ViewHeading.vue';
import StatsCard from '../components/StatsCard.vue';


const statsMap = ref<StatsMap>(new Map());

const dateDescStatsList = computed(() => {
  const statsArr = Array.from(statsMap.value.values());

  statsArr.sort((statsA, statsB) => {
    const dateA = new Date(statsA.date);
    const dateB = new Date(statsB.date);
    return dateB.getTime() - dateA.getTime(); // 直近の日付順でソート
  });

  return statsArr;
});

(async () => {
  statsMap.value = await window.statsMap.getStatsMap();
})();
</script>

<template>
  <VContainer>
    <ViewHeading title="統計" />
    <StatsCard v-for="stats in dateDescStatsList" :stats />
  </VContainer>
</template>
