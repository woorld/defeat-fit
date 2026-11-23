<script setup lang="ts">
import { ref } from 'vue';
import { useDefeatCountStore } from '@src/stores/defeat-count';
import BaseDialog from '@src/components/common/BaseDialog.vue';

const defeatCount = useDefeatCountStore();
const isShowDialog = ref(false);
</script>

<template>
  <VBtn
    color="green"
    icon="mdi-plus"
    size="36"
    @click="isShowDialog = true"
  />
  <BaseDialog v-model="isShowDialog">
    <div class="d-flex justify-center align-center ga-8 flex-column">
      <h3 class="text-h5">自主カウント</h3>
      <p>負けカウントとは別に、自主的にこなす分のカウントを増減します</p>
      <div class="d-flex justify-center align-center ga-4 border rounded-xl">
        <VBtn
          flat
          icon="mdi-minus"
          :disabled="defeatCount.selfCount <= 0"
          @click="defeatCount.decrementSelfCount"
        />
        <span class="self-count text-h4 text-green">{{ defeatCount.selfCount }}</span>
        <VBtn
          flat
          icon="mdi-plus"
          @click="defeatCount.incrementSelfCount"
        />
      </div>
    </div>
  </BaseDialog>
</template>

<style scoped>
.self-count {
  width: 70px;
}
</style>
