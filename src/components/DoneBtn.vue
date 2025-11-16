<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import ConfirmDialog from './ConfirmDialog.vue';
import { useDefeatCountStore } from '../stores/defeat-count';
import { MenuIdWithMultiplier } from '../../common/types';

const router = useRouter();
const defeatCount = useDefeatCountStore();

const props = defineProps<{
  menuIdWithMultiplierList: MenuIdWithMultiplier[],
}>();

const isShowDialog = ref(false);

const onDone = async () => {
  await window.statsList.addStats(defeatCount.count, props.menuIdWithMultiplierList);
  window.defeatCount.resetDefeatCount();

  // NOTE: ダイアログの非表示は画面遷移後も処理しようとしてコンソールに警告が出るため行わない
  router.push('stats');
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
