<script setup lang="ts">
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
    <RouterView v-slot="{Component}">
      <Transition mode="out-in">
        <Component :is="Component" />
      </Transition>
    </RouterView>
  </VContainer>
</template>
