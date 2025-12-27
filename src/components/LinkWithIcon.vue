<script setup lang="ts">
import { ALLOWED_EXTERNAL_LINKS } from '../../common/constants';
const props = defineProps<{
  linkType: string, // keyof typeof ALLOWED~ は不可
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
