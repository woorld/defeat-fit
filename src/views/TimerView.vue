<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import timerEndSound from '../assets/timer-end.mp3';

const route = useRoute();

// timerIdはrefで管理する必要がない
let timerId: number | null = null;
let recentTimerSeconds = 0;
const soundTimerEnd = new Audio(timerEndSound);

const timerSeconds = ref(Number(route.params.seconds) || 0);
const isProgressingTimer = ref(false);

const minutes = computed(() => String(Math.floor(timerSeconds.value / 60)).padStart(2, '0'));
const seconds = computed(() => String(timerSeconds.value % 60).padStart(2, '0'));

const startTimer = () => {
  if (isProgressingTimer.value || timerId != null) {
    return;
  }

  recentTimerSeconds = timerSeconds.value;

  timerId = window.setInterval(() => {
    timerSeconds.value -= 1;
    if (timerSeconds.value <= 0) {
      soundTimerEnd.currentTime = 0;
      soundTimerEnd.play();
      stopTimer();
    }
  }, 1000);

  isProgressingTimer.value = true;
};

const stopTimer = () => {
  if (!isProgressingTimer.value || timerId == null) {
    return;
  }

  window.clearInterval(timerId);
  timerId = null;

  isProgressingTimer.value = false;

  // NOTE: ノータイムでやると0秒が表示されず違和感があるため、少しおいてから初期値に戻す
  window.setTimeout(() => {
    timerSeconds.value = recentTimerSeconds;
  }, 1000);
};

const onClickToggleBtn = () => {
  if (isProgressingTimer.value) {
    stopTimer();
    return;
  }
  startTimer();
}
</script>

<template>
  <VContainer class="d-flex justify-center align-center flex-column ga-8 h-100">
    <div class="d-flex justify-center align-center ga-4">
      <VBtn
        icon="mdi-chevron-double-left"
        :disabled="timerSeconds < 10"
        @click="timerSeconds -= 10"
      />
      <VBtn
        icon="mdi-chevron-left"
        :disabled="timerSeconds < 1"
        @click="timerSeconds -= 1"
      />
      <span class="timer-seconds text-h2">
        {{ minutes }} : {{ seconds }}
      </span>
      <VBtn icon="mdi-chevron-right" @click="timerSeconds += 1" />
      <VBtn icon="mdi-chevron-double-right" @click="timerSeconds += 10" />
    </div>
    <VBtn
      :disabled="timerSeconds <= 0"
      @click="onClickToggleBtn"
    >{{ isProgressingTimer ? 'Stop' : 'Start' }}</VBtn>
  </VContainer>
</template>
