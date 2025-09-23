<script setup lang="ts">
import { ref } from 'vue';
import { useDefeatCountStore } from '../stores/defeat-count';
import ConfirmDialog from './ConfirmDialog.vue';

const defeatCount = useDefeatCountStore();
const isShowDialog = ref(false);

const onDecrement = async () => {
  await defeatCount.decrement();
  isShowDialog.value = false;
};
</script>

<template>
  <VBtn class="w-100 mt-8 bg-red-darken-4" :disabled="defeatCount.count <= 0">今のなし
    <ConfirmDialog
      v-model="isShowDialog"
      title="事故死？"
      explanation="ほんとに死亡回数を-1する？"
      yesBtnColor="red"
      reverseYesNoPosition
      activateByParent
      @click-yes="onDecrement"
      @click-no="isShowDialog = false"
    />
  </VBtn>
</template>
