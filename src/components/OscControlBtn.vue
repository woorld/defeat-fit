<script setup lang="ts">
import { ref, computed } from 'vue';

const isListening = ref(false);

const label = computed(() => isListening.value ? 'OSC受信中' : 'OSC受信停止中');

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
    :color="isListening ? 'green' : 'yellow'"
    :prepend-icon="isListening ? 'mdi-wifi' : 'mdi-wifi-strength-off'"
    @click="toggleListeningStatus"
  >{{ label }}</VBtn>
</template>
