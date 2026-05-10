import { defineStore } from 'pinia';
import type { Notice } from '@common/types';
import { ref } from 'vue';

export const useNoticeStore = defineStore('notice', () => {
  const noticeList = ref<Notice[]>([]);

  const isAppCloseConfirmDialogVisible = ref(false);
  const appCloseConfirmDialogText = ref('');

  window.notice.onCreateNotice(notice => noticeList.value.push(notice));
  window.notice.onShowAppCloseConfirmDialog(text => {
    appCloseConfirmDialogText.value = text;
    isAppCloseConfirmDialogVisible.value = true;
  });

  return {
    noticeList,
    isAppCloseConfirmDialogVisible,
    appCloseConfirmDialogText,
  };
});
