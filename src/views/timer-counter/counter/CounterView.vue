<script setup lang="ts">
import { ref } from 'vue';
import { useRoute } from 'vue-router';
import { useCounter } from './composables/counter';
import CountControl from '../components/CountControl.vue';

const route = useRoute();

const count = ref(Number(route.params.count) || 0);
const setCount = ref(Number(route.params.setCount) || 1);

const {
  counterStatus,
  isLockControl,
  canStart,
  timerDisplay,
  startCount,
  stopCount,
  onNext,
} = useCounter(count, setCount);
</script>

<template>
  <VContainer class="d-flex justify-center align-center flex-column ga-8 h-100">
    <CountControl
      v-model:count="count"
      v-model:setCount="setCount"
      :isStandby="counterStatus === 'STANDBY'"
      :isBreakTime="counterStatus === 'BREAK_TIME'"
      :isLockControl
    >
      <div class="d-flex w-100 justify-space-between align-baseline">
        <span v-show="counterStatus === 'PROGRESS'">あと</span>
        <span class="text-h2 flex-grow-1 text-center">{{ counterStatus === 'BREAK_TIME' ? timerDisplay : count }}</span>
        <span v-show="counterStatus === 'PROGRESS'">回</span>
      </div>
    </CountControl>
    <div class="d-flex justify-center align-center ga-4">
      <VBtn
        :disabled="!canStart"
        @click="counterStatus === 'STANDBY' ? startCount() : stopCount()"
      >{{ counterStatus === 'STANDBY' ? 'START' : 'STOP' }}</VBtn>
      <VBtn
        v-show="counterStatus !== 'STANDBY'"
        @click="onNext"
      >NEXT</VBtn>
    </div>
    <VAlert
      class="position-fixed bottom-0 mb-16"
      type="info"
      variant="tonal"
    >
      <VKbd>START</VKbd>押下後に「あと○回」のカウントが変わらないのは仕様です。<br>
      表示されている回数分の筋トレが終わったら<VKbd>NEXT</VKbd>を押してください。<br>
      今後のアップデートで自動カウント機能を実装予定です。
    </VAlert>
  </VContainer>
</template>
