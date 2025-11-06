<script setup lang="ts">
import { ref, computed } from 'vue';
import ViewHeading from '../components/ViewHeading.vue';
import StatsCard from '../components/StatsCard.vue';
import type { StatsWithMenus, TotalStats } from '../../common/types';

const statsList = ref<StatsWithMenus[]>([]);
const totalStats = ref<TotalStats | undefined>(undefined);

const dateDescStatsList = computed(() => {
  const sortedStats = statsList.value.toSorted((statsA, statsB) => {
    const dateA = new Date(statsA.date);
    const dateB = new Date(statsB.date);
    return dateB.getTime() - dateA.getTime(); // 直近の日付順でソート
  });

  return sortedStats;
});

(async () => {
  statsList.value = await window.statsList.getStatsList();
  totalStats.value = await window.statsList.getTotalStats();
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
