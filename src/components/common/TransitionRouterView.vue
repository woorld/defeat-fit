<script setup lang="ts"></script>

<template>
  <RouterView v-slot="{Component}">
    <Transition mode="out-in">
      <Component :is="Component" />
    </Transition>
  </RouterView>
</template>

<style scoped>
.v-enter-active,
.v-leave-active {
  transition: .15s ease;
}

.v-enter-from,
.v-leave-to {
  opacity: 0;
}
</style>
