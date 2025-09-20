<script setup lang="ts">
import { ref } from 'vue';
import { useDeathCountStore } from '../stores/death-count';
import ConfirmDialog from './ConfirmDialog.vue';

const deathCount = useDeathCountStore();
const isShowDialog = ref(false);

const onDecrement = async () => {
  await deathCount.decrement();
  isShowDialog.value = false;
};
</script>

<template>
  <VBtn class="w-100 mt-8 bg-red-darken-4" :disabled="deathCount.count <= 0">今のなし
    <ConfirmDialog
      v-model="isShowDialog"
      title="事故死？"
      explanation="ほんとに死亡回数を-1する？"
      yesBtnColor="red"
      reverseYesNoPosition
      activateByParent
      @click-yes="onDecrement"
    />
  </VBtn>
</template>
