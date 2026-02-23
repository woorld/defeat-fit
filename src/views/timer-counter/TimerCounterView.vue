<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();

// NOTE: 現状/timer-counter以下にはtimer, counterしかないため、isInCounterViewは不要
const isInTimerView = computed(() => route.path.startsWith('/timer-counter/timer'));
</script>

<template>
  <VContainer class="h-100">
    <VBtnToggle
      class="d-flex justify-center rounded-xl position-fixed left-0 right-0 mt-6"
      density="comfortable"
    >
      <VBtn
        border
        to="/timer-counter/timer/0/1"
        :active="isInTimerView"
      >タイマー</VBtn>
      <VBtn
        border
        to="/timer-counter/counter/0/1"
        :active="!isInTimerView"
      >カウンター</VBtn>
    </VBtnToggle>
    <RouterView v-slot="{Component}">
      <Transition mode="out-in">
        <Component :is="Component" />
      </Transition>
    </RouterView>
  </VContainer>
</template>
