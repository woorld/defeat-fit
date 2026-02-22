<script setup lang="ts">
import { SETTING_DEFAULT_VALUE } from '@common/constants';
import { computed, onUnmounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import setStartSound from '@src/assets/sound/timer/start.mp3';
import setEndSound from '@src/assets/sound/timer/end.mp3';
import CountControl from '../components/CountControl.vue';

const route = useRoute();
const setStartAudio = new Audio(setStartSound);
const setEndAudio = new Audio(setEndSound);

// TODO: OVR連携の自動カウント機能実装時にrecentCountの追加が必要
let recentSetCount = 1;
let breakTimeSeconds = SETTING_DEFAULT_VALUE.breakTimeSecBetweenSets;

const counterStatus = ref<'STANDBY' | 'PROGRESS' | 'BREAK_TIME'>('STANDBY');
const count = ref(Number(route.params.count) || 0);
const setCount = ref(Number(route.params.setCount) || 1);
const timerId = ref<number | null>(null);
const timerSeconds = ref(0);

const isLockControl = computed(() => counterStatus.value !== 'STANDBY');
const canStart = computed(() => count.value >= 1);
const timerDisplay = computed(() => {
  const minutes = String(Math.floor(timerSeconds.value / 60)).padStart(2, '0');
  const seconds = String(timerSeconds.value % 60).padStart(2, '0');
  return `${minutes} : ${seconds}`;
});

const startCount = () => {
  playAudio(setStartAudio);
  recentSetCount = setCount.value;
  counterStatus.value = 'PROGRESS';
};

const stopCount = () => {
  clearTimer();
  counterStatus.value = 'STANDBY';
};

const onNext = () => {
  if (counterStatus.value === 'BREAK_TIME') {
    // 休憩終了、次のセット開始
    clearTimer();
    counterStatus.value = 'PROGRESS';
    return;
  }

  // 1セット完了
  playAudio(setEndAudio);
  setCount.value--;

  if (setCount.value <= 0) {
    setCount.value = recentSetCount;
    counterStatus.value = 'STANDBY';
    return;
  }

  timerSeconds.value = breakTimeSeconds;
  timerId.value = window.setInterval(timerLoop, 1000);
  counterStatus.value = 'BREAK_TIME';
};

const timerLoop = () => {
  timerSeconds.value--;
  if (timerSeconds.value >= 1) {
    return;
  }

  playAudio(setStartAudio);
  clearTimer();
  onNext();
};

// TODO: 共通化
const playAudio = (audio: HTMLAudioElement) => {
  audio.currentTime = 0;
  audio.play();
};

const clearTimer = () => {
  if (!timerId.value) {
    return;
  }
  window.clearInterval(timerId.value);
  timerId.value = null;
}

(async () => {
  const setting = await window.setting.getAllSetting();

  breakTimeSeconds = setting.breakTimeSecBetweenSets;
  setStartAudio.volume = setting.soundVolume;
  setEndAudio.volume = setting.soundVolume;
})();

onUnmounted(() => {
  clearTimer();
  setStartAudio.pause();
  setEndAudio.pause();
});
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
