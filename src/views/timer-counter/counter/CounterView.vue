<script setup lang="ts">
import { ref } from 'vue';
import { useRoute } from 'vue-router';
import { useCounter } from './composables/counter';
import { autoCountSetupStage, useAutoCount } from './composables/auto-count';
import { useOscStore } from '@src/stores/osc';
import CountControl from '../components/CountControl.vue';
import UprightIndicator from './components/UprightIndicator.vue';

const route = useRoute();
const oscStore = useOscStore();

const count = ref(Number(route.params.count) || 0);
const setCount = ref(Number(route.params.setCount) || 1);
const enableAutoCount = ref(true);
const isAutoCountSetupOverlayVisible = ref(false);

const {
  counterStatus,
  isLockControl,
  canStart,
  timerDisplay,
  startCount,
  stopCount,
  onNext,
  decrementCount,
} = useCounter(count, setCount);

const {
  autoCountSetupStatus,
  maxUpright,
  minUpright,
  uprightAdjust,
  autoCountSetupProgress,
  setupAutoCount,
  resetAutoCountSetupStatus,
} = useAutoCount({ counterStatus, onNext, decrementCount });

const onClickStart = async () => {
  if (!enableAutoCount.value) {
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

const onClickStop = () => {
  stopCount();
  resetAutoCountSetupStatus();
};

const onClickAutoCountSetupCancel = () => {
  resetAutoCountSetupStatus();
  isAutoCountSetupOverlayVisible.value = false;
}
</script>

<template>
  <VContainer class="d-flex justify-center align-center flex-column ga-8 h-100">
    <UprightIndicator
      v-show="enableAutoCount"
      :currentUpright="oscStore.upright"
      :maxUpright
      :minUpright
      :uprightAdjust
      :autoCountSetupStatus
      :isPointerVisible="oscStore.oscStatus === 'OPEN_UPRIGHT'"
    />
    <CountControl
      v-model:count="count"
      v-model:setCount="setCount"
      v-model:enableAutoCount="enableAutoCount"
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
        @click="counterStatus === 'STANDBY' ? onClickStart() : onClickStop()"
      >{{ counterStatus === 'STANDBY' ? 'START' : 'STOP' }}</VBtn>
      <VBtn
        v-show="counterStatus !== 'STANDBY'"
        @click="onNext"
      >NEXT</VBtn>
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
        <div v-else class="d-flex flex-column justify-center align-center ga-6">
          <p>
            <template v-if="autoCountSetupStatus <= autoCountSetupStage.MIN">
              頭の位置の最小値を設定します。<br />
              今から行う筋トレの中で<strong>一番低い姿勢</strong>で止まってください。
            </template>
            <template v-else-if="autoCountSetupStatus >= autoCountSetupStage.MAX">
              頭の位置の最大値を設定します。<br />
              今から行う筋トレの中で<strong>一番高い姿勢</strong>で止まってください。
            </template>
          </p>
          <VProgressLinear
            v-model="autoCountSetupProgress"
            :min="0"
            :max="5"
          />
          <VBtn variant="outlined" @click="onClickAutoCountSetupCancel">キャンセル</VBtn>
        </div>
      </VSheet>
    </VOverlay>
  </VContainer>
</template>
