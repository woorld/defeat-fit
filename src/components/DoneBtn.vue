<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import ConfirmDialog from './ConfirmDialog.vue';
import type { StatsMenu } from '../../common/types';
import type { Menu } from '../../prisma/generated/client';
import { useDefeatCountStore } from '../stores/defeat-count';

const router = useRouter();
const defeatCount = useDefeatCountStore();

const props = defineProps<{
  menuList: Menu[],
}>();

const isShowDialog = ref(false);

const onDone = async () => {
  // FIXME: 統計のPrisma移行時に対応
  // @ts-ignore
  const newStats: StatsMenu[] = props.menuList.map(menu => ({
    id: menu.id,
    name: menu.name,
    unit: menu.unit,
    count: Math.ceil(menu.multiplier * defeatCount.count),
  }));

  await window.statsMap.addStats(defeatCount.count, newStats);
  window.defeatCount.resetDefeatCount();

  router.push('stats');
  isShowDialog.value = false;
};
</script>

<template>
  <VBtn color="green" :disabled="defeatCount.count <= 0">
    やった
    <ConfirmDialog
      v-model="isShowDialog"
      explanation="今日の分を登録する？"
      yesBtnColor="green"
      activateByParent
      @click-yes="onDone"
      @click-no="isShowDialog = false"
    />
  </VBtn>
</template>
