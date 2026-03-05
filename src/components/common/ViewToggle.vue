<script setup lang="ts">
import { useRoute } from 'vue-router';

const route = useRoute();

const props = defineProps<{
  viewOptions: {
    label: string,
    path: string,
    isActive?: () => boolean,
  }[],
}>();
</script>

<template>
  <VBtnToggle
    class="d-flex justify-center rounded-xl mt-6 mb-10"
    density="comfortable"
  >
    <VBtn
      v-for="view in props.viewOptions"
      border
      :to="view.path"
      :active="view.isActive
        ? view.isActive()
        : route.path.startsWith(view.path)
      "
    >{{ view.label }}</VBtn>
  </VBtnToggle>
</template>
