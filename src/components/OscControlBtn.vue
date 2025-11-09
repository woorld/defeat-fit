<script setup lang="ts">
import { ref, computed } from 'vue';

const isListening = ref(false);

const label = computed(() => isListening.value ? 'OSC受信中' : 'OSC受信停止中');

const toggleListeningStatus = async () => {
  if (isListening.value) {
    await window.osc.stopListening();
  }
  else {
    await window.osc.startListening();
  }

  isListening.value = await window.osc.getListeningStatus();
};

(async () => {
  isListening.value = await window.osc.getListeningStatus();
})();
</script>

<template>
  <VBtn
    class="position-fixed top-0 right-0 ma-4"
    :color="isListening ? 'green' : 'yellow'"
    :prepend-icon="isListening ? 'mdi-wifi' : 'mdi-wifi-strength-off'"
    rounded
    @click="toggleListeningStatus"
  >{{ label }}</VBtn>
</template>
