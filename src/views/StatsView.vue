<script setup lang="ts">
import { ref, computed } from 'vue';
import ViewHeading from '../components/ViewHeading.vue';
import StatsCard from '../components/StatsCard.vue';
import type { StatsWithMenus, TotalStats } from '../../common/types';

// TODO: 名前変更
const statsMap = ref<StatsWithMenus[]>([]);
const totalStats = ref<TotalStats | undefined>(undefined);

const dateDescStatsList = computed(() => {
  const sortedStats = statsMap.value.toSorted((statsA, statsB) => {
    const dateA = new Date(statsA.date);
    const dateB = new Date(statsB.date);
    return dateB.getTime() - dateA.getTime(); // 直近の日付順でソート
  });

  return sortedStats;
});

(async () => {
  statsMap.value = await window.statsMap.getStatsMap();
  totalStats.value = await window.statsMap.getTotalStats();
})();
</script>

<template>
  <VContainer>
    <ViewHeading title="統計" />
    <StatsCard
      v-if="totalStats"
      title="Total"
      :defeatCount="totalStats.defeatCount"
      :statsMenuList="totalStats.statsMenuList"
    />
    <StatsCard
      v-for="stats in dateDescStatsList"
      :title="stats.date"
      :defeatCount="stats.defeatCount"
      :statsMenuList="stats.statsMenuList"
    />
  </VContainer>
</template>
