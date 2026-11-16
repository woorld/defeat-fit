<script setup lang="ts">
import { ref } from 'vue';
import BottomNav from '@src/components/BottomNav.vue';
import { useNoticeStore } from '@src/stores/notice';
import UpdateDialog from '@src/components/UpdateDialog.vue';
import TransitionRouterView from '@src/components/common/TransitionRouterView.vue';
import AppCloseConfirmDialog from '@src/components/AppCloseConfirmDialog.vue';
import { isOverlayWindow } from '@src/composables/common/window-type';

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
    <!-- NOTE: アップデート・終了確認はアプリ全体に対する操作のため、メインウィンドウだけで扱う -->
    <template v-if="!isOverlayWindow">
      <UpdateDialog v-model="isUpdateDialogVisible" />
      <AppCloseConfirmDialog />
    </template>
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
