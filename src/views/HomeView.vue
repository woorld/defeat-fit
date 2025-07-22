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
])
</script>

<template>
  <VContainer>
    <div class="death-count">
      <VIcon>mdi-coffin</VIcon>×<span class="death-count__count">{{ count }}</span>
    </div>
    <VTable>
      <tbody>
        <tr v-for="resultItem of result">
          <td>{{ resultItem.name }}</td>
          <td>{{ count * resultItem.multiplier }} {{ resultItem.unit }}</td>
        </tr>
      </tbody>
    </VTable>
  </VContainer>
</template>

<style scoped lang="scss">
.death-count {
  text-align: center;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 32px;
  gap: 4px;
  margin-bottom: 16px;

  &__count {
    margin-left: 8px;
  }
}
</style>
