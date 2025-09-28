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
    <VCard v-for="statsItem in stats" class="mb-6">
      <template #text>
        <div class="d-flex justify-space-between align-center ga-4">
          <div class="w-25 text-center">
            <span class="text-h6">{{ statsItem.date.replace(/\-/g, '/') }}</span>
            <div class="text-h4 d-flex justify-center align-center mt-3">
              <VIcon>mdi-coffin</VIcon>
              <!-- NOTE: marginはアイコンの余白に合わせるためのもの -->
              <div class="mx-2 mb-1">{{ statsItem.defeatCount }}</div>
            </div>
          </div>
          <VDivider
            class="mr-3"
            vertical
            inset
          />
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
