<script setup lang="ts">
import { computed } from 'vue';
import type { Stats } from '../../common/types';

const props = defineProps<{
  stats: Stats,
}>();

// dateがない場合は合計表示とする
const title = computed(() => props.stats.date ? props.stats.date.replace(/\-/g, '/') : 'Total');
</script>

<template>
  <VCard class="mb-6">
    <template #text>
      <div class="d-flex justify-space-between align-center ga-4">
        <div class="w-25 text-center">
          <span class="text-h6">{{ title }}</span>
          <div class="text-h4 d-flex justify-center align-center mt-3">
            <VIcon>mdi-coffin</VIcon>
            <!-- NOTE: marginはアイコンの余白に合わせるためのもの -->
            <div class="mx-2 mb-1">{{ props.stats.defeatCount }}</div>
          </div>
        </div>
        <VDivider
          class="mr-3"
          vertical
          inset
        />
        <VTable class="flex-1-1-0" density="compact">
          <tbody>
            <tr v-for="menu of props.stats.menuList">
              <td>{{ menu.name }}</td>
              <td class="text-right">{{ menu.count }} {{ menu.unit }}</td>
            </tr>
          </tbody>
        </VTable>
      </div>
    </template>
  </VCard>
</template>
