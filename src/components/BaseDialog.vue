<script setup lang="ts">
const props = defineProps<{
  activateByParent?: boolean,
  canClose?: boolean,
}>();

const emit = defineEmits<{
  (e: 'close'): void,
}>();

const model = defineModel<boolean>({ required: true });
</script>

<template>
  <VDialog
    v-model="model"
    :activator="props.activateByParent ? 'parent' : undefined"
    :persistent="!canClose"
    @afterLeave="emit('close')"
  >
    <VSheet class="pa-8 text-center">
      <slot />
    </VSheet>
    <VBtn
      class="position-absolute top-0 right-0 mt-2 mr-2 elevation-0"
      icon="mdi-close"
      :disabled="!canClose"
      @click="model = false"
    />
  </VDialog>
</template>
