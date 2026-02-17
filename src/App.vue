<script setup lang="ts">
import { ref } from 'vue';
import BottomNav from '@src/components/BottomNav.vue';
import { useNoticeStore } from '@src/stores/notice';
import UpdateDialog from '@src/components/UpdateDialog.vue';

const noticeStore = useNoticeStore();

const isUpdateDialogVisible = ref(false);
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
    <!-- HACK: 閉じるボタンをmdi-closeにしようとすると割とめんどくさい -->
    <VSnackbarQueue
      v-model="noticeStore.noticeList"
      timeout="3000"
      location="top left"
      closable
      close-text="×"
      timer
    />
    <UpdateDialog v-model="isUpdateDialogVisible" />
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
