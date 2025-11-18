<script setup lang="ts">
const props = defineProps<{
  itemName: string,
}>();
</script>

<template>
  <VCard
    class="py-8 text-center"
    :title="`${props.itemName}がありません`"
  />
</template>
