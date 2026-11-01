<script setup lang="ts">
import { ref, computed } from 'vue';
import ViewHeading from '@src/components/common/ViewHeading.vue';
import StatsCard from './components/StatsCard.vue';
import type { StatsWithMenus, TotalStats } from '@common/types';
import ItemEmptyCard from '@src/components/common/ItemEmptyCard.vue';
import ManualStatsDialog from './components/ManualStatsDialog.vue';

const statsList = ref<StatsWithMenus[]>([]);
const totalStats = ref<TotalStats | undefined>(undefined);
const isManualStatsDialogVisible = ref(false);
const manualStatsFixedDate = ref<string | null>(null);

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
    window.stats.getStatsList(),
    window.stats.getTotalStats(),
  ]);

  statsList.value = result[0];
  totalStats.value = result[1];
};

const deleteStats = async (id: number) => {
  await window.stats.deleteStats(id);
  getStats();
};

const openManualStatsDialog = (date: string | null) => {
  manualStatsFixedDate.value = date;
  isManualStatsDialogVisible.value = true;
};

getStats();
</script>

<template>
  <VContainer>
    <ViewHeading title="統計" />
    <div class="d-flex justify-end mb-6">
      <VBtn
        rounded
        prepend-icon="mdi-plus"
        @click="openManualStatsDialog(null)"
      >手動登録</VBtn>
    </div>
    <!-- NOTE: 手動登録のみの統計は負け回数が0のため、負け回数ではなく統計の有無で判定する -->
    <template v-if="totalStats !== undefined && statsList.length >= 1">
      <StatsCard :stats="totalStats" />
      <VDivider class="mb-6" />
    </template>
    <ItemEmptyCard v-else itemName="統計" />
    <StatsCard
      v-for="stats in dateDescStatsList"
      :stats
      @delete-stats="deleteStats"
      @edit-manual-stats="openManualStatsDialog"
    />
    <ManualStatsDialog
      v-model="isManualStatsDialogVisible"
      :statsList
      :fixedDate="manualStatsFixedDate"
      @save="getStats"
    />
  </VContainer>
</template>
