<script setup lang="ts">
import { useNoticeStore } from '@src/stores/notice';
import ConfirmDialog from '@src/components/common/ConfirmDialog.vue';

const noticeStore = useNoticeStore();

const onAccept = () => {
  window.notice.acceptClose();
}
</script>

<template>
  <ConfirmDialog
    v-model="noticeStore.isAppCloseConfirmDialogVisible"
    yes-btn-color="red"
    reverse-yes-no-position
    :explanation="noticeStore.appCloseConfirmDialogText"
    @click-yes="onAccept"
    @click-no="noticeStore.isAppCloseConfirmDialogVisible = false"
  />
</template>
