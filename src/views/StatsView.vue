<script setup lang="ts">
import { ref, computed } from 'vue';
import ViewHeading from '../components/ViewHeading.vue';
import StatsCard from '../components/StatsCard.vue';
import type { StatsWithMenus } from '../../common/types';

// TODO: 名前変更
const statsMap = ref<StatsWithMenus[]>([]);

const dateDescStatsList = computed(() => {
  const sortedStats = statsMap.value.toSorted((statsA, statsB) => {
    const dateA = new Date(statsA.date);
    const dateB = new Date(statsB.date);
    return dateB.getTime() - dateA.getTime(); // 直近の日付順でソート
  });

  return sortedStats;
});

// TODO: Prismaの機能で何とかする
// const totalStats = computed<Stats>(() => {
//   let totalDefeatCount = 0;
//   let totalMenuList: StatsMenu[] = [];

//   for (const stats of statsMap.value) {
//     totalDefeatCount += stats.defeatCount;
//     totalMenuList = mergeStatsMenu(totalMenuList, stats.statsMenuList);
//   }

//   return {
//     defeatCount: totalDefeatCount,
//     menuList: totalMenuList,
//   };
// });

(async () => {
  statsMap.value = await window.statsMap.getStatsMap();
})();
</script>

<template>
  <VContainer>
    <ViewHeading title="統計" />
    <!-- <StatsCard :stats="totalStats" /> -->
    <StatsCard v-for="stats in dateDescStatsList" :stats />
  </VContainer>
</template>
