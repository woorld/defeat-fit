<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useTimer } from './composables/timer';
import CountControl from '../components/CountControl.vue';

const route = useRoute();

const timerSeconds = ref(Number(route.params.seconds) || 0);
const setCount = ref(Number(route.params.setCount) || 1);

const {
  timerStatus,
  timerDisplay,
  startTimer,
  stopTimer,
} = useTimer(timerSeconds, setCount);

const canStart = computed(() => timerStatus.value === 'STANDBY');
</script>

<template>
  <VContainer class="d-flex justify-center align-center flex-column ga-8 h-100">
    <CountControl
      v-model:count="timerSeconds"
      v-model:setCount="setCount"
      :isStandby="timerStatus === 'STANDBY'"
      :isBreakTime="timerStatus === 'BREAK_TIME'"
      :isLockControl="timerStatus !== 'STANDBY'"
    >
      <div class="text-h2 w-100 text-center">{{ timerDisplay }}</div>
    </CountControl>
    <VBtn
      :disabled="timerStatus === 'END' || timerSeconds <= 0"
      @click="canStart ? startTimer() : stopTimer()"
    >{{ canStart ? 'START' : 'STOP' }}</VBtn>
  </VContainer>
</template>
