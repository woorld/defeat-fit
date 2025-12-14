<script setup lang="ts">
import BottomNav from './components/BottomNav.vue';
import { useNoticeStore } from './stores/notice';

const noticeStore = useNoticeStore();
</script>

<template>
  <VApp>
    <VMain>
      <RouterView v-slot="{Component}">
        <Transition mode="out-in">
          <Component :is="Component" />
        </Transition>
      </RouterView>
    </VMain>
    <BottomNav />
    <VSnackbarQueue
      v-model="noticeStore.noticeList"
      timeout="5000"
      location="bottom left"
      closable
      close-text="閉じる"
    />
  </VApp>
</template>

<style>
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP&display=swap');

* {
  font-family: "Noto Sans JP" !important;
}

html {
  overflow-y: auto !important;
}

.v-enter-active,
.v-leave-active {
  transition: .15s ease;
}

.v-enter-from,
.v-leave-to {
  opacity: 0;
}
</style>
