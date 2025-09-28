<script setup lang="ts">
import { ref } from 'vue';
import ConfirmDialog from './ConfirmDialog.vue';
import type { Menu, StatsMenu } from '../../common/types';
import { useDefeatCountStore } from '../stores/defeat-count';

const defeatCount = useDefeatCountStore();

const props = defineProps<{
  menuList: Menu[],
}>();

const isShowDialog = ref(false);

const onDone = async () => {
  const newStats: StatsMenu[] = props.menuList.map(menu => ({
    id: menu.id,
    name: menu.name,
    unit: menu.unit,
    count: menu.multiplier * defeatCount.count,
  }));

  await window.stats.addStats(defeatCount.count, newStats);
  window.defeatCount.resetDefeatCount();

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
