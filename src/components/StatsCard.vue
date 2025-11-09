<script setup lang="ts">
import { TotalStatsMenu } from '../../common/types';
import { menuUnitMap } from '../../common/util';

const props = defineProps<{
  title: string,
  defeatCount: number,
  // NOTE: { count: number, menu: Menu }を持つオブジェクトを許容する
  statsMenuList: TotalStatsMenu[],
}>();
</script>

<template>
  <VCard class="mb-6">
    <template #text>
      <div class="d-flex justify-space-between align-center ga-4">
        <div class="w-25 text-center">
          <span class="text-h6">{{ props.title }}</span>
          <div class="text-h4 d-flex justify-center align-center mt-3">
            <VIcon>mdi-coffin</VIcon>
            <!-- NOTE: marginはアイコンの余白に合わせるためのもの -->
            <div class="mx-2 mb-1">{{ props.defeatCount }}</div>
          </div>
        </div>
        <VDivider
          class="mr-3"
          vertical
          inset
        />
        <VTable class="flex-1-1-0" density="compact">
          <tbody>
            <tr v-for="statsMenu of props.statsMenuList">
              <td>{{ statsMenu.menu?.name }}</td>
              <td class="text-right">{{ statsMenu.count }} {{ menuUnitMap[statsMenu.menu?.unit || 'COUNT'] }}</td>
            </tr>
          </tbody>
        </VTable>
      </div>
    </template>
  </VCard>
</template>
