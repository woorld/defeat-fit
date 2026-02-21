<script setup lang="ts">
import { ref } from 'vue';
import { useRoute } from 'vue-router';
import { useTimer } from './composables/timer';

const route = useRoute();

const timerSeconds = ref(Number(route.params.seconds) || 0);
const setCount = ref(Number(route.params.setCount) || 1);

const {
  timerStatus,
  timerDisplay,
  isLockControl,
  isLockStartStop,
  canStart,
  startTimer,
  stopTimer,
} = useTimer(timerSeconds, setCount);
</script>

<template>
  <VContainer class="d-flex justify-center align-center flex-column ga-8 h-100">
    <div class="d-flex justify-space-between align-center ga-4" v-if="!isLockControl">
      <VLabel>セット数</VLabel>
      <VNumberInput
        class="flex-grow-0"
        v-model="setCount"
        hide-details
        inset
        :min="1"
        :disabled="isLockControl"
      />
    </div>
    <!-- NOTE: VDividerが中央に来るようにtext-align, widthを設定 -->
    <div class="d-flex justify-center align-center ga-4 w-100" v-if="timerStatus !== 'STANDBY'">
      <div class="w-50" :class="timerStatus === 'BREAK_TIME' ? 'text-right' : 'text-center'">
        あと <span class="text-h4 ma-3">{{ setCount }}</span> セット
      </div>
      <template v-if="timerStatus === 'BREAK_TIME'">
        <VDivider vertical />
        <span class="text-h5 text-green w-50">休憩中</span>
      </template>
    </div>
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
