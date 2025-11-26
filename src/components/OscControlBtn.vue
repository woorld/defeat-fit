<script setup lang="ts">
import { computed } from 'vue';
import { useOscStore } from '../stores/osc';

const oscStore = useOscStore();

const label = computed(() => oscStore.isListening ? 'OSC受信中' : 'OSC受信停止中');
const color = computed(() => oscStore.isListening ? 'green' : 'yellow');
const icon = computed(() => oscStore.isListening ? 'mdi-wifi' : 'mdi-wifi-strength-off');
</script>

<template>
  <VBtn
    class="position-fixed top-0 right-0 ma-4"
    :color
    :prepend-icon="icon"
    :loading="oscStore.loading"
    :disabled="oscStore.loading"
    rounded
    @click="oscStore.toggleListeningStatus"
  >{{ label }}</VBtn>
</template>
