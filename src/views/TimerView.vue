<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import timerStartCountdownSound from '../assets/timer-start-countdown.mp3';
import timerStartSound from '../assets/timer-start.mp3';
import timerEndSound from '../assets/timer-end.mp3';

const route = useRoute();

let recentTimerSeconds = 0;
let audioPlayCount = 0;

const soundTimerStartCountdown = new Audio(timerStartCountdownSound);
const soundTimerStart = new Audio(timerStartSound);
const soundTimerEnd = new Audio(timerEndSound);

const timerId = ref<number | null>(null);
const timerSeconds = ref(Number(route.params.seconds) || 0);
const setCount = ref(Number(route.params.setCount) || 1);
const breakTimeSeconds = ref(60);
const timerStatus = ref<'STANDBY' | 'COUNTDOWN' | 'PROGRESS' | 'BREAK_TIME' |'END'>('STANDBY');

const timerDisplay = computed(() => {
  const minutes = String(Math.floor(timerSeconds.value / 60)).padStart(2, '0');
  const seconds = String(timerSeconds.value % 60).padStart(2, '0');
  return `${minutes} : ${seconds}`;
});
const isLockControl = computed(() => timerStatus.value !== 'STANDBY');
const isLockStartStop = computed(() => timerStatus.value === 'END' || timerSeconds.value <= 0);
const canStart = computed(() => timerStatus.value === 'STANDBY');

const startTimer = () => {
  timerStatus.value = 'COUNTDOWN';
  recentTimerSeconds = timerSeconds.value;
  audioPlayCount = 0;

  timerLoop(); // NOTE: 最初の1回は即時実行したいためここで呼び出す
  timerId.value = window.setInterval(timerLoop, 1000);
};

const timerLoop = () => {
  switch(timerStatus.value) {
    case 'STANDBY':
      return;
    case 'COUNTDOWN':
      if (audioPlayCount >= 5) {
        playAudio(soundTimerStart);
        audioPlayCount = 0;
        timerStatus.value = 'PROGRESS';
      }
      else {
        playAudio(soundTimerStartCountdown);
        audioPlayCount++;
      }
      return;
    case 'PROGRESS':
      timerSeconds.value--;

      if (timerSeconds.value >= 1) {
        return;
      }

      setCount.value--;
      playAudio(soundTimerEnd); // NOTE: 最初の1回は即時実行したいためここで呼び出す
      audioPlayCount++;

      if (setCount.value <= 0) {
        timerStatus.value = 'END';
        return;
      }

      audioPlayCount = 0;
      timerStatus.value = 'BREAK_TIME';
      timerSeconds.value = breakTimeSeconds.value;
      return;
    case 'BREAK_TIME':
      timerSeconds.value--;

      if (timerSeconds.value <= 0) {
        playAudio(soundTimerStart);
        timerSeconds.value = recentTimerSeconds;
        timerStatus.value = 'PROGRESS';
        return;
      }

      if (timerSeconds.value <= 5) {
        playAudio(soundTimerStartCountdown);
        return;
      }
      return;
    case 'END':
      if (setCount.value <= 0 && audioPlayCount < 3) {
        // セットが0になった場合、効果音を追加で2回（合計3回）鳴らす
        playAudio(soundTimerEnd);
        audioPlayCount++;
        return;
      }
      audioPlayCount = 0;
      stopTimer();
      return;
    default:
      return;
  }
};

const stopTimer = () => {
  if (timerId.value == null) {
    return;
  }

  if (setCount.value <= 0) {
    setCount.value = 1;
  }

  if (timerSeconds.value <= 0 || timerStatus.value === 'BREAK_TIME') {
    timerSeconds.value = recentTimerSeconds;
  }

  window.clearInterval(timerId.value);
  timerId.value = null;
  timerStatus.value = 'STANDBY';
};

const playAudio = (audio: HTMLAudioElement) => {
  audio.currentTime = 0;
  audio.play();
};

onUnmounted(() => {
  if (timerId.value) {
    clearInterval(timerId.value);
  }

  soundTimerStartCountdown.pause();
  soundTimerStart.pause();
  soundTimerEnd.pause();
});
</script>

<template>
  <VContainer class="d-flex justify-center align-center flex-column ga-8 h-100">
    <!-- TODO: 入力欄のラベル -->
    <VNumberInput
      class="flex-grow-0"
      v-model="setCount"
      hide-details
      inset
      :min="1"
      :disabled="isLockControl"
    />
    <VNumberInput
      class="flex-grow-0"
      v-model="breakTimeSeconds"
      hide-details
      inset
      :min="1"
      :disabled="isLockControl"
    />
    <div class="d-flex justify-center align-center ga-4">
      <VBtn
        icon="mdi-chevron-double-left"
        :disabled="timerSeconds < 10 || isLockControl"
        @click="timerSeconds -= 10"
      />
      <VBtn
        icon="mdi-chevron-left"
        :disabled="timerSeconds < 1 || isLockControl"
        @click="timerSeconds -= 1"
      />
      <!-- TODO: 休憩中のことをもっとわかりやすくする -->
      <span
        class="timer-seconds text-h2"
        :class="{ 'text-green': timerStatus === 'BREAK_TIME' }"
      >{{ timerDisplay }}</span>
      <VBtn
        icon="mdi-chevron-right"
        :disabled="isLockControl"
        @click="timerSeconds += 1"
      />
      <VBtn
        icon="mdi-chevron-double-right"
        :disabled="isLockControl"
        @click="timerSeconds += 10"
      />
    </div>
    <VBtn
      :disabled="isLockStartStop"
      @click="canStart ? startTimer() : stopTimer()"
    >{{ canStart ? 'START' : 'STOP' }}</VBtn>
  </VContainer>
</template>
