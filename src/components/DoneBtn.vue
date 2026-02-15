<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import ConfirmDialog from '@src/components/ConfirmDialog.vue';
import { useDefeatCountStore } from '@src/stores/defeat-count';
import { MenuIdWithMultiplier } from '@common/types';

const router = useRouter();
const defeatCount = useDefeatCountStore();

const props = defineProps<{
  menuIdWithMultiplierList: MenuIdWithMultiplier[],
}>();

const isShowDialog = ref(false);

const onDone = async () => {
  await window.stats.addStats(defeatCount.count, props.menuIdWithMultiplierList);
  window.defeatCount.resetDefeatCount();

  // NOTE: ダイアログの非表示は画面遷移後も処理しようとしてコンソールに警告が出るため行わない
  router.push('stats');
};
</script>

<template>
  <VBtn color="green" :disabled="defeatCount.count <= 0">
    全部やった
    <ConfirmDialog
      v-model="isShowDialog"
      title="お疲れさまでした"
      explanation="本日分を統計に登録しますか？"
      yesBtnColor="green"
      activateByParent
      @click-yes="onDone"
      @click-no="isShowDialog = false"
    />
  </VBtn>
</template>
