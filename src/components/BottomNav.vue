<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useOscStore } from '../stores/osc';

const route = useRoute();
const oscStore = useOscStore();

const isInMenuView = computed(() => route.path.startsWith('/menu'));
</script>

<template>
  <VBottomNavigation>
    <VBtn to="/">
      <VIcon>mdi-home</VIcon>
    </VBtn>
    <VBtn to="/timer/0/1">
      <VIcon>mdi-timer</VIcon>
    </VBtn>
    <VBtn to="/menu/edit" :active="isInMenuView">
      <VIcon>mdi-menu</VIcon>
    </VBtn>
    <VBtn to="/stats">
      <VIcon>mdi-chart-bar</VIcon>
    </VBtn>
    <VBtn to="/setting" :disabled="oscStore.oscStatus === 'PENDING'">
      <VIcon>mdi-cog</VIcon>
    </VBtn>
  </VBottomNavigation>
</template>
