<script setup lang="ts">
import { ref } from 'vue';
import { useDefeatCountStore } from '@src/stores/defeat-count';
import ConfirmDialog from '@src/components/common/ConfirmDialog.vue';

const defeatCount = useDefeatCountStore();
const isShowDialog = ref(false);

const onDecrement = async () => {
  await defeatCount.decrement();
  isShowDialog.value = false;
};
</script>

<template>
  <VBtn color="red" :disabled="defeatCount.count <= 0">
    今のなし
    <ConfirmDialog
      v-model="isShowDialog"
      title="カウントの修正"
      explanation="本当にカウントを-1しますか？"
      yesBtnColor="red"
      reverseYesNoPosition
      activateByParent
      @click-yes="onDecrement"
      @click-no="isShowDialog = false"
    />
  </VBtn>
</template>
