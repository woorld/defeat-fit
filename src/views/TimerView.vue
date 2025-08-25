<script setup lang="ts">
// TODO: 無理がある実装なのでリファクタリングする
import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import timerEndSound from '../assets/timer-end.mp3';
import timerStartCountdownSound from '../assets/timer-start-countdown.mp3';
import timerStartSound from '../assets/timer-start.mp3';

const route = useRoute();

let recentTimerSeconds = 0;
const soundTimerEnd = new Audio(timerEndSound);
const soundTimerStartCountdown = new Audio(timerStartCountdownSound);
const soundTimerStart = new Audio(timerStartSound);

const timerId = ref<number | null>(null);
const timerSeconds = ref(Number(route.params.seconds) || 0);
const setCount = ref(Number(route.params.setCount) || 1);
const isProgressingTimer = ref(false);

const minutes = computed(() => String(Math.floor(timerSeconds.value / 60)).padStart(2, '0'));
const seconds = computed(() => String(timerSeconds.value % 60).padStart(2, '0'));

const startTimer = async () => {
  if (isProgressingTimer.value || timerId.value != null) {
    return;
  }

  recentTimerSeconds = timerSeconds.value;
  isProgressingTimer.value = true;

  for (let i = 1; i <= 6; i++) {
    if (!isProgressingTimer.value) {
      return;
    }

    if (i == 6) {
      playAudio(soundTimerStart);
      break;
    }

    playAudio(soundTimerStartCountdown);
    await freeze1Sec(); // TODO: playAudio()にループ機能を内包？
  }

  timerId.value = window.setInterval(progressTimer, 1000);
};

const stopTimer = () => {
  if (!isProgressingTimer.value || timerId.value == null) {
    return;
  }

  window.clearInterval(timerId.value);
  timerId.value = null;

  isProgressingTimer.value = false;
};

const progressTimer = () => {
  timerSeconds.value -= 1;
  if (timerSeconds.value <= 0) {
    setCount.value -= 1;
    playAudio(soundTimerEnd);

    // NOTE: ノータイムでやると0秒が表示されず違和感があるため、少しおいてから初期値に戻す
    window.setTimeout(() => {
      stopTimer();
      timerSeconds.value = recentTimerSeconds;
      setCount.value = 1;
    }, 800); // 1秒にするとタイマーが無駄に進んでしまう
  }
};

const freeze1Sec = () => new Promise(res => setTimeout(res, 1000));

const playAudio = (audio: HTMLAudioElement) => {
  audio.currentTime = 0;
  audio.play();
};

const onClickToggleBtn = () => {
  if (isProgressingTimer.value) {
    stopTimer();
    return;
  }
  startTimer();
};
</script>

<template>
  <VContainer class="d-flex justify-center align-center flex-column ga-8 h-100">
    <VNumberInput
      class="flex-grow-0"
      v-model="setCount"
      hide-details
      inset
      :min="1"
      :disabled="isProgressingTimer"
    />
    <div class="d-flex justify-center align-center ga-4">
      <VBtn
        icon="mdi-chevron-double-left"
        :disabled="timerSeconds < 10 || isProgressingTimer"
        @click="timerSeconds -= 10"
      />
      <VBtn
        icon="mdi-chevron-left"
        :disabled="timerSeconds < 1 || isProgressingTimer"
        @click="timerSeconds -= 1"
      />
      <span class="timer-seconds text-h2">
        {{ minutes }} : {{ seconds }}
      </span>
      <VBtn
        icon="mdi-chevron-right"
        :disabled="isProgressingTimer"
        @click="timerSeconds += 1"
      />
      <VBtn
        icon="mdi-chevron-double-right"
        :disabled="isProgressingTimer"
        @click="timerSeconds += 10"
      />
    </div>
    <VBtn
      :disabled="timerSeconds <= 0 || timerId == null && isProgressingTimer"
      @click="onClickToggleBtn"
    >{{ isProgressingTimer ? 'Stop' : 'Start' }}</VBtn>
  </VContainer>
</template>
