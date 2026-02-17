import { defineStore } from 'pinia';
import type { Notice } from '@common/types';
import { ref } from 'vue';

export const useNoticeStore = defineStore('notice', () => {
  const noticeList = ref<Notice[]>([]);

  window.notice.onCreateNotice(notice => noticeList.value.push(notice));

  return { noticeList };
});
