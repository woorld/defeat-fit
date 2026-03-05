<script setup lang="ts">
import { ref } from 'vue';
import BottomNav from '@src/components/BottomNav.vue';
import { useNoticeStore } from '@src/stores/notice';
import UpdateDialog from '@src/components/UpdateDialog.vue';
import TransitionRouterView from './components/common/TransitionRouterView.vue';

const noticeStore = useNoticeStore();

const isUpdateDialogVisible = ref(false);
</script>

<template>
  <VApp>
    <VMain>
      <TransitionRouterView />
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
</style>
