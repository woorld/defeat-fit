<script setup lang="ts">
import ViewToggle from '@src/components/common/ViewToggle.vue';
import { computed } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();

// NOTE: 現状/timer-counter以下にはtimer, counterしかないため、isInCounterViewは不要
const isInTimerView = computed(() => route.path.startsWith('/timer-counter/timer'));

const viewOptions = [
  {
    label: 'タイマー',
    path: '/timer-counter/timer/0/1',
    isActive: () => isInTimerView.value,
  },
  {
    label: 'カウンター',
    path: '/timer-counter/counter/0/1',
    isActive: () => !isInTimerView.value,
  },
];
</script>

<template>
  <VContainer class="h-100">
    <ViewToggle class="position-fixed left-0 right-0" :viewOptions />
    <RouterView v-slot="{Component}">
      <Transition mode="out-in">
        <Component :is="Component" />
      </Transition>
    </RouterView>
  </VContainer>
</template>
