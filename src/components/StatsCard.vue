<script setup lang="ts">
import { ref, computed } from 'vue';
import { TotalStatsMenu } from '../../common/types';
import { menuUnitMap } from '../../common/util';
import ConfirmDialog from './ConfirmDialog.vue';

const props = defineProps<{
  title: string,
  defeatCount: number,
  // NOTE: { count: number, menu: Menu }を持つオブジェクトを許容する
  statsMenuList: TotalStatsMenu[], // FIXME: stats: Stats | TotalStatsとかにできない？
}>();

const emit = defineEmits<{
  (e: 'delete-stats', date: string): void,
}>();

const isDeleteDialogVisible = ref(false);

// HACK: 現状総統計か否かの判定材料がこれしかない
const isTotalStats = computed(() => props.title === 'Total');

const onDeleteStats = () => {
  emit('delete-stats', props.title); // NOTE: titleはdate(YYYY-MM-DD)
  isDeleteDialogVisible.value = false;
};
</script>

<template>
  <VCard class="mb-6 py-2">
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
        <VBtn
          v-if="!isTotalStats"
          class="text-red flex-0-1-1"
          icon="mdi-trash-can"
          elevation="0"
          :rounded="false"
          @click="isDeleteDialogVisible = true"
        />
      </div>
    </template>
  </VCard>
  <ConfirmDialog
    v-model="isDeleteDialogVisible"
    title="統計の削除"
    yesBtnColor="red"
    reverseYesNoPosition
    @click-yes="onDeleteStats"
    @click-no="isDeleteDialogVisible = false"
  >
    本当に {{ props.title }} の統計を削除する？
  </ConfirmDialog>
</template>
