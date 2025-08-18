<script setup lang="ts">
import { ref, computed } from 'vue';

const count = ref(0);

window.osc.onUpdateDeathCount((deathCount) => {
  count.value = deathCount;
});

type resultData = {
  name: string,
  multiplier: number,
  unit?: string
};

// TODO: 外部化
const result = computed<resultData[]>(() => [
  {
    name: 'プランク',
    multiplier: 5,
    unit: '秒',
  },
  {
    name: 'ワイドスクワット',
    multiplier: 3,
    unit: '回',
  },
  {
    name: 'ダンベルフレンチプレス',
    multiplier: 2,
    unit: '回',
  }
]);

const isShowDialog = ref(false);

const onDecrement = async () => {
  const newDeathCount = await window.osc.decrementDeathCount();
  count.value = newDeathCount;
  isShowDialog.value = false;
};
</script>

<template>
  <VContainer>
    <div class="d-flex justify-center align-center mt-8 mb-13">
      <VIcon class="text-h2">mdi-coffin</VIcon>
      <span class="text-h5">×</span>
      <span class="ml-3 text-h3 mb-2">{{ count }}</span>
    </div>
    <h2 class="text-center text-h5 mb-4">- 本日のメニュー -</h2>
    <VTable>
      <tbody>
        <tr v-for="resultItem of result">
          <td>{{ resultItem.name }}</td>
          <td>× {{ resultItem.multiplier }} {{ resultItem.unit }}</td>
          <td class="text-right">
            <span
              class="bg-red-accent-2 text-black pt-1 pb-1 pr-2 pl-2 rounded font-weight-bold"
            >{{ count * resultItem.multiplier }} {{ resultItem.unit }}</span>
          </td>
        </tr>
      </tbody>
    </VTable>
    <VBtn class="w-100 mt-8 bg-red-darken-4">今のなし
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
  </VContainer>
</template>
