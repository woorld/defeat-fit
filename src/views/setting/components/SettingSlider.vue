<script setup lang="ts">
import type { Setting } from '@common/types';

const props = defineProps<{
  settingName: keyof Setting,
  label: string,
  step: number,
  min?: number,
  max?: number,
}>();

const model = defineModel<number>({ required: true });
</script>

<template>
  <div>
    <VLabel>{{ props.label }}</VLabel>
    <VSlider
      class="mt-2"
      v-model="model"
      hide-details
      :step="props.step"
      :min="props.min"
      :max="props.max"
    >
      <template #append>
        <VNumberInput
          class="ml-4"
          v-model="model"
          :value="model"
          hide-details
          density="compact"
          variant="outlined"
          control-variant="hidden"
          :step="props.step"
          :min="props.min"
          :max="props.max"
        />
      </template>
    </VSlider>
  </div>
</template>
