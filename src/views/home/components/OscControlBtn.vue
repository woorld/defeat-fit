<script setup lang="ts">
import { computed, ref } from 'vue';
import { useOscStore } from '@src/stores/osc';

const oscStore = useOscStore();

const isTargetOscMessageEmpty = ref(false);

const isListeningTarget = computed(() => oscStore.oscStatus === 'OPEN');
const label = computed(() => isListeningTarget.value ? 'OSC受信中' : 'OSC受信停止中');
const color = computed(() => isListeningTarget.value ? 'green' : 'yellow');
const icon = computed(() => isListeningTarget.value ? 'mdi-wifi' : 'mdi-wifi-strength-off');
const isTooltipVisible = computed(() => isTargetOscMessageEmpty.value && !oscStore.isListening);

(async () => {
  const targetOscMessage = (await window.setting.getSetting('targetOscMessage')).filter(s => s.enabled);

  if (targetOscMessage.length <= 0) {
    isTargetOscMessageEmpty.value = true;
  }
})();
</script>

<template>
  <VBtn
    :color
    :prepend-icon="icon"
    :loading="oscStore.pending"
    :disabled="oscStore.pending || isTooltipVisible"
    rounded
    @click="oscStore.toggleListeningStatus"
  >
    {{ label }}
    <VTooltip
      class="text-center"
      activator="parent"
      location="bottom right"
      no-click-animation
      interactive
      :model-value="isTooltipVisible"
      :open-on-click="false"
      :open-on-focus="false"
      :open-on-hover="false"
    >
      <p>対象のOSCメッセージが<br />設定されていません</p>
      <VBtn
        class="mt-2"
        append-icon="mdi-chevron-right"
        to="/setting"
      >設定する</VBtn>
    </VTooltip>
  </VBtn>
</template>
