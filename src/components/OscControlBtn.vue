<script setup lang="ts">
import { ref } from 'vue';

const isListening = ref(false);

const toggleListeningStatus = async () => {
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
    :color="isListening ? 'yellow' : 'green'"
    :icon="isListening ? 'mdi-pause' : 'mdi-play'"
    @click="toggleListeningStatus"
  />
</template>
