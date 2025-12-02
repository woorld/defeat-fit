<script setup lang="ts">
import { computed, ref } from 'vue';
import { useOscStore } from '../stores/osc';
import { VBtn } from 'vuetify/components';

const oscStore = useOscStore();

const isTargetOscMessageEmpty = ref(false);

const label = computed(() => oscStore.isListening ? 'OSC受信中' : 'OSC受信停止中');
const color = computed(() => oscStore.isListening ? 'green' : 'yellow');
const icon = computed(() => oscStore.isListening ? 'mdi-wifi' : 'mdi-wifi-strength-off');
const isTooltipVisible = computed(() => isTargetOscMessageEmpty.value && !oscStore.isListening);

(async () => {
  const targetOscMessage = await window.setting.getSetting('targetOscMessage');

  if (targetOscMessage === '') {
    isTargetOscMessageEmpty.value = true;
  }
})();
</script>

<template>
  <VBtn
    class="position-fixed top-0 right-0 ma-4"
    :color
    :prepend-icon="icon"
    :loading="oscStore.loading"
    :disabled="oscStore.loading || isTooltipVisible"
    rounded
    @click="oscStore.toggleListeningStatus"
  >
    {{ label }}
    <VTooltip
      activator="parent"
      location="left"
      no-click-animation
      interactive
      :model-value="isTooltipVisible"
      :open-on-click="false"
      :open-on-focus="false"
      :open-on-hover="false"
    >
      <div class="d-flex justify-center align-center ga-2">
        対象のOSCメッセージが設定されていません
        <VBtn append-icon="mdi-chevron-right" to="/setting">設定する</VBtn>
      </div>
    </VTooltip>
  </VBtn>
</template>
