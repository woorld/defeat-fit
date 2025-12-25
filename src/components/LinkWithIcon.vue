<script setup lang="ts">
import { ALLOWED_EXTERNAL_LINKS } from '../../common/constants';
const props = defineProps<{
  linkType: keyof typeof ALLOWED_EXTERNAL_LINKS,
  linkText: string,
  iconName: string,
  iconColor: string,
}>();
</script>

<template>
  <a
    class="d-inline-flex justify-center align-center ga-2 border rounded-xl px-3 py-1"
    target="_blank"
    :href="ALLOWED_EXTERNAL_LINKS[props.linkType]"
  >
    <VIcon size="32" :color="props.iconColor">{{ props.iconName }}</VIcon>
    <span class="text-grey">{{ props.linkText }}</span>
    <VIcon size="16" color="grey">mdi-open-in-new</VIcon>
  </a>
</template>

<style scoped>
a {
  color: white;
  text-decoration: none;
}
</style>
