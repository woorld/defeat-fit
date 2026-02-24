<script setup lang="ts">
import { onUnmounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useCounter } from './composables/counter';
import { useOscStore } from '@src/stores/osc';
import CountControl from '../components/CountControl.vue';
import UprightIndicator from './components/UprightIndicator.vue';

const route = useRoute();
const oscStore = useOscStore();

// TODO: 設定で変更できるようにする
const uprightAdjust = 0.01;

const count = ref(Number(route.params.count) || 0);
const setCount = ref(Number(route.params.setCount) || 1);
const maxUpright = ref(1);
const minUpright = ref(0);

const {
  counterStatus,
  isLockControl,
  canStart,
  timerDisplay,
  startCount,
  stopCount,
  onNext,
} = useCounter(count, setCount, maxUpright, minUpright, uprightAdjust);

oscStore.startListeningUpright();

onUnmounted(() => {
  // FIXME: リッスン開始中に別画面に移動すると別画面でUprightの受信が始まる
  if (oscStore.oscStatus !== 'OPEN_UPRIGHT') {
    return;
  }
  window.osc.stopListening();
});
</script>

<template>
  <VContainer class="d-flex justify-center align-center flex-column ga-8 h-100">
    <UprightIndicator
      :currentUpright="oscStore.upright"
      :maxUpright
      :minUpright
      :uprightAdjust
    />
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
      <!-- FIXME: テスト用ボタン MAX, MIN設定処理実装後に削除 -->
      <VBtn @click="maxUpright = oscStore.upright">MAX: {{ maxUpright }}</VBtn>
      <VBtn @click="minUpright = oscStore.upright">MIN: {{ minUpright }}</VBtn>
    </div>
  </VContainer>
</template>
