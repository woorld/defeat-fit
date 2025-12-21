<script setup lang="ts">
import { ALLOWED_EXTERNAL_LINKS } from '../../common/constants';
const props = defineProps<{
  linkType: string, // keyof typeof ALLOWED~ は不可
  iconName: string,
  iconSize: number,
}>();
</script>

<template>
  <a :href="ALLOWED_EXTERNAL_LINKS[props.linkType]" target="_blank">
    <VIcon :size="props.iconSize">{{ props.iconName }}</VIcon>
  </a>
</template>
