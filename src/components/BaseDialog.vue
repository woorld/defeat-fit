<script setup lang="ts">
const props = defineProps<{
  activateByParent?: boolean,
}>();

const model = defineModel<boolean>({ required: true });
</script>

<template>
  <VDialog v-model="model" :activator="props.activateByParent ? 'parent' : undefined">
    <VSheet class="pa-8 text-center">
      <slot />
    </VSheet>
    <VBtn
      class="position-absolute top-0 right-0 mt-2 mr-2 elevation-0"
      icon="mdi-close"
      @click="model = false"
    />
  </VDialog>
</template>
