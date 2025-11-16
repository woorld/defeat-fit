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

const getStats = async () => {
  const result = await Promise.all([
    window.statsList.getStatsList(),
    window.statsList.getTotalStats(),
  ]);

  statsList.value = result[0];
  totalStats.value = result[1];
};

const deleteStats = async (id: number) => {
  await window.statsList.deleteStats(id);
  getStats();
};

getStats();
</script>

<template>
  <VContainer>
    <ViewHeading title="統計" />
    <template v-if="totalStats !== undefined && totalStats.defeatCount >= 1">
      <StatsCard :stats="totalStats" />
      <VDivider class="mb-6" />
    </template>
    <VCard v-else title="統計がありません" class="py-8 text-center" />
    <StatsCard
      v-for="stats in dateDescStatsList"
      :stats
      @delete-stats="deleteStats"
    />
  </VContainer>
</template>
