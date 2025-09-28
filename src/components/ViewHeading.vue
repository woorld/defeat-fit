<script setup lang="ts">
const props = defineProps<{
  title: string,
}>();
</script>

<template>
  <h2 class="text-h4 text-center mt-6 mb-10">{{ props.title }}</h2>
</template>
