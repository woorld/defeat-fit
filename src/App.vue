<script setup lang="ts">
</script>

<template>
  <VApp>
    <VMain>
      <Transition>
        <RouterView />
      </Transition>
    </VMain>
    <VBottomNavigation>
      <VBtn to="/">
        <VIcon>mdi-home</VIcon>
      </VBtn>
      <VBtn to="/timer/0/1">
        <VIcon>mdi-timer</VIcon>
      </VBtn>
      <VBtn to="/menu-edit">
        <!-- TODO: 仮アイコン -->
        <VIcon>mdi-menu</VIcon>
      </VBtn>
      <VBtn to="/stats">
        <VIcon>mdi-chart-bar</VIcon>
      </VBtn>
      <VBtn to="/setting">
        <VIcon>mdi-cog</VIcon>
      </VBtn>
    </VBottomNavigation>
  </VApp>
</template>

<style scoped>
.v-enter-active,
.v-leave-active {
  transition: 300ms ease;
}

.v-enter-from,
.v-leave-to {
  opacity: 0;
}
</style>

<style>
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP&display=swap');
* {
  font-family: "Noto Sans JP" !important;
}

html {
  overflow-y: auto !important;
}
</style>
