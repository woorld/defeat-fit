<script setup lang="ts">
import { ref, computed, toRaw } from 'vue';
import type { Stats, StatsMap, StatsMenu } from '../../common/types';
import ViewHeading from '../components/ViewHeading.vue';
import { mergeStatsMenu } from '../../common/util';
import StatsCard from '../components/StatsCard.vue';

const statsMap = ref<StatsMap>(new Map());

const dateDescStatsList = computed<Stats[]>(() => {
  const statsArr = Array.from(statsMap.value.values());

  statsArr.sort((statsA, statsB) => {
    const dateA = new Date(statsA.date || 0);
    const dateB = new Date(statsB.date || 0);
    return dateB.getTime() - dateA.getTime(); // 直近の日付順でソート
  });

  return statsArr;
});

const totalStats = computed<Stats>(() => {
  let totalDefeatCount = 0;
  let totalMenuList: StatsMenu[] = [];

  for (const stats of Array.from(statsMap.value.values())) {
    console.log(toRaw(stats))
    totalDefeatCount += stats.defeatCount;
    totalMenuList = mergeStatsMenu(totalMenuList, stats.menuList);
  }

  return {
    defeatCount: totalDefeatCount,
    menuList: totalMenuList,
  };
});

(async () => {
  statsMap.value = await window.statsMap.getStatsMap();
})();
</script>

<template>
  <VContainer>
    <ViewHeading title="統計" />
    <StatsCard :stats="totalStats" />
    <StatsCard v-for="stats in dateDescStatsList" :stats />
  </VContainer>
</template>
