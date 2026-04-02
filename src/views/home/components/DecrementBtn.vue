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
  <VBtn
    color="red"
    :disabled="defeatCount.count <= 0"
    icon="mdi-minus"
    size="36"
    @click="isShowDialog = true"
  />
  <ConfirmDialog
    v-model="isShowDialog"
    title="カウントの修正"
    explanation="本当にカウントを-1しますか？"
    yesBtnColor="red"
    reverseYesNoPosition
    @click-yes="onDecrement"
    @click-no="isShowDialog = false"
  />
</template>
