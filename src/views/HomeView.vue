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
    multiplier: 2,
    unit: '回',
  },
  {
    name: 'ダンベルフレンチプレス',
    multiplier: 3,
    unit: '回',
  }
]);
</script>

<template>
  <VContainer>
    <div class="d-flex justify-center align-center mt-8 mb-10">
      <VIcon class="text-h2">mdi-coffin</VIcon>
      <span class="text-h5">×</span>
      <span class="ml-3 text-h3 mb-2">{{ count }}</span>
    </div>
    <h2 class="text-center text-h5 mb-4">本日のメニュー</h2>
    <VTable>
      <tbody>
        <tr v-for="resultItem of result">
          <td>{{ resultItem.name }}</td>
          <td>{{ count * resultItem.multiplier }} {{ resultItem.unit }}</td>
        </tr>
      </tbody>
    </VTable>
    <VBtn class="w-100 mt-8">やった</VBtn>
  </VContainer>
</template>
