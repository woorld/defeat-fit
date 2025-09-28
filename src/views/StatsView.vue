<script setup lang="ts">
import { ref } from 'vue';
import type { Stats } from '../../common/types';
import ViewHeading from '../components/ViewHeading.vue';

const stats = ref<Stats[]>([]);

(async () => {
  stats.value = await window.stats.getStats();
})();
</script>

<template>
  <VContainer>
    <ViewHeading title="統計" />
    <VCard
      v-for="statsItem in stats"
      class="mb-6"
      :title="statsItem.date"
    >
      <template #text>
        <div class="d-flex justify-space-between align-center ga-4">
          <span class="text-h4 w-25">
            <VIcon>mdi-coffin</VIcon>
            {{ statsItem.defeatCount }}
          </span>
          <VTable class="flex-1-1-0" density="compact">
            <tbody>
              <tr v-for="menuItem of statsItem.menu">
                <td>{{ menuItem.name }}</td>
                <td class="text-right">{{ menuItem.count }} {{ menuItem.unit }}</td>
              </tr>
            </tbody>
          </VTable>
        </div>
      </template>
    </VCard>
  </VContainer>
</template>
