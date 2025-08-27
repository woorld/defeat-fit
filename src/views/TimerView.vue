<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import timerEndSound from '../assets/timer-end.mp3';
import timerStartCountdownSound from '../assets/timer-start-countdown.mp3';
import timerStartSound from '../assets/timer-start.mp3';

const route = useRoute();

let recentTimerSeconds = 0;
let audioPlayCount = 0;

const soundTimerEnd = new Audio(timerEndSound);
const soundTimerStartCountdown = new Audio(timerStartCountdownSound);
const soundTimerStart = new Audio(timerStartSound);

const timerId = ref<number | null>(null);
const timerSeconds = ref(Number(route.params.seconds) || 0);
const setCount = ref(Number(route.params.setCount) || 1);
const timerStatus = ref<'STANDBY' | 'COUNTDOWN' | 'PROGRESS' | 'END'>('STANDBY');

const minutes = computed(() => String(Math.floor(timerSeconds.value / 60)).padStart(2, '0'));
const seconds = computed(() => String(timerSeconds.value % 60).padStart(2, '0'));
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

      if (timerSeconds.value <= 0) {
        setCount.value--;
        playAudio(soundTimerEnd); // NOTE: 最初の1回は即時実行したいためここで呼び出す
        timerStatus.value = 'END';
      }

      return;
    case 'END':
      // TODO: セットが0になった時の専用処理
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

  window.clearInterval(timerId.value);
  timerId.value = null;
  timerSeconds.value = recentTimerSeconds;
  recentTimerSeconds = 0;
  timerStatus.value = 'STANDBY';
};

const playAudio = (audio: HTMLAudioElement) => {
  audio.currentTime = 0;
  audio.play();
};

// TODO: ページ移動時のタイマークリア
</script>

<template>
  <VContainer class="d-flex justify-center align-center flex-column ga-8 h-100">
    <VNumberInput
      class="flex-grow-0"
      v-model="setCount"
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
      <span class="timer-seconds text-h2">
        {{ minutes }} : {{ seconds }}
      </span>
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
