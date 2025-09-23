<script setup lang="ts">
import { ref } from 'vue';

const isListening = ref(false);

const onClick = async () => {
  isListening.value = isListening.value
    ? await window.osc.stopListening()
    : await window.osc.startListening();
};

(async () => {
  isListening.value = await window.osc.getListeningStatus();
})();
</script>

<template>
  <VBtn
    class="position-fixed top-0 right-0 ma-4"
    :class="isListening ? ' bg-amber' : ' bg-green'"
    :icon="isListening ? 'mdi-pause' : 'mdi-play'"
    @click="onClick"
  />
</template>
