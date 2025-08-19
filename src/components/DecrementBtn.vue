<script setup lang="ts">
import { ref } from 'vue';
import { useDeathCountStore } from '../stores/death-count';

const deathCount = useDeathCountStore();
const isShowDialog = ref(false);

const onDecrement = async () => {
  await deathCount.decrement();
  isShowDialog.value = false;
};
</script>

<template>
  <VBtn class="w-100 mt-8 bg-red-darken-4" :disabled="deathCount.count <= 0">今のなし
    <VDialog v-model="isShowDialog" activator="parent">
      <VSheet class="pa-8 text-center">
        <h3 class="text-h5">事故死？</h3>
        <p class="mt-4">ほんとに死亡回数を-1する？</p>
        <div class="w-100 mt-8 d-flex justify-center align-center ga-4">
          <VBtn class="bg-red-darken-4" @click="onDecrement">はい</VBtn>
          <VBtn class="bg-grey-darken-3" @click="isShowDialog = false">いいえ</VBtn>
        </div>
      </VSheet>
      <VBtn
        class="position-absolute top-0 right-0 mt-6 mr-6 elevation-0"
        icon="mdi-close"
        @click="isShowDialog = false"
      />
    </VDialog>
  </VBtn>
</template>
