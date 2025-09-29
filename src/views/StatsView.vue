<script setup lang="ts">
import { ref } from 'vue';
import type { Stats } from '../../common/types';
import ViewHeading from '../components/ViewHeading.vue';

const statsList = ref<Stats[]>([]);

(async () => {
  statsList.value = await window.statsList.getStatsList();
})();
</script>

<template>
  <VContainer>
    <ViewHeading title="統計" />
    <VCard v-for="stats in statsList" class="mb-6">
      <template #text>
        <div class="d-flex justify-space-between align-center ga-4">
          <div class="w-25 text-center">
            <span class="text-h6">{{ stats.date.replace(/\-/g, '/') }}</span>
            <div class="text-h4 d-flex justify-center align-center mt-3">
              <VIcon>mdi-coffin</VIcon>
              <!-- NOTE: marginはアイコンの余白に合わせるためのもの -->
              <div class="mx-2 mb-1">{{ stats.defeatCount }}</div>
            </div>
          </div>
          <VDivider
            class="mr-3"
            vertical
            inset
          />
          <VTable class="flex-1-1-0" density="compact">
            <tbody>
              <tr v-for="menu of stats.menuList">
                <td>{{ menu.name }}</td>
                <td class="text-right">{{ menu.count }} {{ menu.unit }}</td>
              </tr>
            </tbody>
          </VTable>
        </div>
      </template>
    </VCard>
  </VContainer>
</template>
