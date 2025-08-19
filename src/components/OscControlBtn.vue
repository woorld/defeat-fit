<script setup lang="ts">
import { ref, computed } from 'vue';

const isListening = ref(false);
const className = computed(() => {
  const commonClass = 'position-fixed top-0 right-0 mt-4 mr-4';
  return commonClass + (isListening.value
    ? ' bg-amber'
    : ' bg-green')
});
const icon = computed(() => isListening.value ? 'mdi-pause' : 'mdi-play');

const onClick = async () => {
  isListening.value = await window.osc.toggleListening();
};

(async () => {
  isListening.value = await window.osc.getListeningStatus();
})();
</script>

<template>
  <VBtn
    :class="className"
    :icon
    @click="onClick"
  />
</template>
