<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import ConfirmDialog from '@src/components/common/ConfirmDialog.vue';
import { useDefeatCountStore } from '@src/stores/defeat-count';
import type { MenuIdWithMultiplier } from '@common/types';

const router = useRouter();
const defeatCount = useDefeatCountStore();

const props = defineProps<{
  menuIdWithMultiplierList: MenuIdWithMultiplier[],
}>();

const isShowDialog = ref(false);

// NOTE: 負け0のときは自主カウント分しか登録されないため、メニューが無いと空の統計になるので登録させない
const isDisabled = computed(() => defeatCount.count <= 0
  && (defeatCount.selfCount <= 0 || props.menuIdWithMultiplierList.length <= 0));

const onDone = async () => {
  await window.stats.addStats(defeatCount.count, defeatCount.selfCount, props.menuIdWithMultiplierList);
  window.defeatCount.resetDefeatCount();
  await defeatCount.resetSelfCount();

  // NOTE: ダイアログの非表示は画面遷移後も処理しようとしてコンソールに警告が出るため行わない
  router.push('stats');
};
</script>

<template>
  <VBtn color="green" :disabled="isDisabled">
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
