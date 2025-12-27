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
  <VBtn
    class="text-capitalize"
    border
    rounded
    elevation="0"
    target="_blank"
    color="transparent"
    append-icon="mdi-open-in-new"
    :href="ALLOWED_EXTERNAL_LINKS[props.linkType]"
  >
    <template #prepend>
      <VIcon size="24">{{ props.iconName }}</VIcon>
    </template>
    {{ props.linkText }}
  </VBtn>
</template>

<style scoped>
a {
  color: white;
  text-decoration: none;
}
</style>
