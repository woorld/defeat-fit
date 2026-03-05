<script setup lang="ts">
import TransitionRouterView from '@src/components/common/TransitionRouterView.vue';
import ViewToggle from '@src/components/common/ViewToggle.vue';

const viewOptions = [
  {
    label: 'メニュー編集',
    path: '/menu/edit',
  },
  {
    label: 'プリセット編集',
    path: '/menu/preset',
  },
];
</script>

<template>
  <VContainer>
    <ViewToggle :viewOptions />
    <TransitionRouterView />
  </VContainer>
</template>
