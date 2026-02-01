<script setup lang="ts">
import { ref } from 'vue';

const tooltipHideMs = 2000;
let tooltipHideTimerId = 0;

const props = defineProps<{
  code: string,
}>();

const isTooltipVisible = ref(false);

const copyCode = async () => {
  await navigator.clipboard.writeText(props.code);

  isTooltipVisible.value = true;

  if (tooltipHideTimerId !== 0) {
    window.clearTimeout(tooltipHideTimerId);
  }

  tooltipHideTimerId = window.setTimeout(() => {
    isTooltipVisible.value = false;
  }, tooltipHideMs);
};
</script>

<template>
  <div class="scroll-container w-100 position-relative">
    <VSheet class="scroll-container w-100 text-left overflow-auto" max-height="300">
      <VCode class="scroll-container d-block w-100 px-4 py-2 overflow-auto">
        <pre class="font-consolas">{{ props.code }}</pre>
      </VCode>
    </VSheet>
    <VTooltip
      location="top"
      text="コピーしました！"
      close-on-content
      no-click-animation
      :model-value="isTooltipVisible"
      :open-on-hover="false"
    >
      <template #activator="{ props }">
        <VBtn
          v-bind="props"
          class="position-absolute top-0 right-0 ma-2"
          size="28"
          color="transparent"
          elevation="0"
          @click="copyCode"
        >
          <VIcon size="16">mdi-content-copy</VIcon>
        </VBtn>
      </template>
    </VTooltip>
  </div>
</template>

<style scoped>
.scroll-container {
  scrollbar-color: inherit transparent;
  scrollbar-width: thin;
}

.font-consolas {
  font-family: "Consolas" !important;
}
</style>
