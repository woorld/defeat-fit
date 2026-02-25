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
let setupTimerId: number | null = null;

const count = ref(Number(route.params.count) || 0);
const setCount = ref(Number(route.params.setCount) || 1);
const maxUpright = ref(1);
const minUpright = ref(0);
const useAutoCount = ref(true);
const isAutoCountSetupOverlayVisible = ref(false);
const autoCountSetupStatus = ref<'MAX' | 'MIN' | 'DONE'>('MAX');
const autoCountSetupProgress = ref(0);

const {
  counterStatus,
  isLockControl,
  canStart,
  timerDisplay,
  startCount,
  stopCount,
  onNext,
} = useCounter(count, setCount, maxUpright, minUpright, uprightAdjust);

const onClickStart = async () => {
  autoCountSetupStatus.value = 'MAX';

  if (!useAutoCount.value) {
    startCount();
    return;
  }

  isAutoCountSetupOverlayVisible.value = true;
  if (oscStore.oscStatus !== 'OPEN_UPRIGHT') {
    await oscStore.startListeningUpright();
  }

  await setupAutoCount();
  isAutoCountSetupOverlayVisible.value = false;
  startCount();
};

const getThreshold = (): Promise<number> => new Promise(resolve => {
  let recentUpright = oscStore.upright;

  // TODO: タイマーがリセットされない導線のチェック
  // TODO: 効果音を鳴らす
  setupTimerId = window.setInterval(() => {
    const currentUpright = oscStore.upright;
    const withinAcceptableRange =
      currentUpright <= recentUpright + uprightAdjust &&
      currentUpright >= recentUpright - uprightAdjust;
    recentUpright = currentUpright;

    if (!withinAcceptableRange) {
      autoCountSetupProgress.value = 0;
      return;
    }

    autoCountSetupProgress.value++;

    if (autoCountSetupProgress.value < 5) {
      return;
    }

    clearSetupTimer();
    autoCountSetupProgress.value = 0;
    return resolve(currentUpright);
  }, 500);
});

const setupAutoCount = async (): Promise<void> => {
  maxUpright.value = await getThreshold();
  autoCountSetupStatus.value = 'MIN';

  minUpright.value = await getThreshold();
  autoCountSetupStatus.value = 'DONE';

  autoCountSetupProgress.value = 0;
  return Promise.resolve();
};

const clearSetupTimer = () => {
  if (setupTimerId === null) {
    return;
  }
  window.clearInterval(setupTimerId);
  setupTimerId = null;
}

const onClickAutoCountSetupCancel = () => {
  autoCountSetupStatus.value = 'MAX';
  clearSetupTimer();
  isAutoCountSetupOverlayVisible.value = false;
}

onUnmounted(() => {
  clearSetupTimer();
  if (oscStore.oscStatus === 'OPEN_UPRIGHT') {
    window.osc.stopListening();
  }
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
        @click="counterStatus === 'STANDBY' ? onClickStart() : stopCount()"
      >{{ counterStatus === 'STANDBY' ? 'START' : 'STOP' }}</VBtn>
      <VBtn
        v-show="counterStatus !== 'STANDBY'"
        @click="onNext"
      >NEXT</VBtn>
      <!-- TODO: レイアウトどうにかならんか -->
      <VSwitch
        v-model="useAutoCount"
        color="green"
        label="自動カウント"
        inset
        hide-details
      />
    </div>
    <VOverlay
      v-model="isAutoCountSetupOverlayVisible"
      class="justify-center align-center"
      persistent
      :opacity="0.5"
    >
      <VSheet class="rounded pa-6 d-flex flex-column justify-center align-center ga-4">
        <div v-if="oscStore.oscStatus === 'PENDING'" class="d-flex justify-center align-center ga-4">
          OSCサーバーを開始しています…
          <VProgressCircular indeterminate />
        </div>
        <div v-else class="d-flex flex-column justify-center align-center ga-4">
          <div>
            <template v-if="autoCountSetupStatus === 'MAX'">
              最大値を設定します。<br />
              今から行う筋トレの<strong>待機状態の姿勢</strong>で止まってください。
            </template>
            <template v-else-if="autoCountSetupStatus === 'MIN'">
              最小値を設定します。<br />
              今から行う筋トレの中で<strong>一番低い姿勢</strong>で止まってください。
            </template>
            <VProgressLinear
              v-model="autoCountSetupProgress"
              class="mt-4"
              :min="0"
              :max="5"
            />
          </div>
          <VBtn variant="outlined" @click="onClickAutoCountSetupCancel">キャンセル</VBtn>
        </div>
      </VSheet>
    </VOverlay>
  </VContainer>
</template>
