<script setup lang="ts">
import { computed } from 'vue';
import { useDeathCountStore } from '../stores/death-count';
import DecrementBtn from '../components/DecrementBtn.vue';

const deathCount = useDeathCountStore();

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
  },
]);
</script>

<template>
  <VContainer>
    <div class="d-flex justify-center align-center mt-8 mb-13">
      <VIcon class="text-h2">mdi-coffin</VIcon>
      <span class="text-h5">×</span>
      <span class="ml-3 text-h3 mb-2">{{ deathCount.count }}</span>
    </div>
    <h2 class="text-center text-h5 mb-4">- 本日のメニュー -</h2>
    <VTable>
      <tbody>
        <tr v-for="resultItem of result">
          <td>{{ resultItem.name }}</td>
          <td>× {{ resultItem.multiplier }} {{ resultItem.unit }}</td>
          <td class="text-right">
            <span
              class="bg-red-accent-3 pt-1 pb-1 pr-2 pl-2 rounded"
            >{{ deathCount.count * resultItem.multiplier }} {{ resultItem.unit }}</span>
          </td>
        </tr>
      </tbody>
    </VTable>
    <DecrementBtn />
  </VContainer>
</template>
