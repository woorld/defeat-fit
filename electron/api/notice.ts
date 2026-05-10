import type { Notice, SendMessage } from '@common/types';
import { ipcMain } from 'electron';
import { defeatCountApi } from '@electron/api/defeat-count';

let isInitialized = false;
let sendMessage: SendMessage | null = null;
let closeWindow: (() => void) | null = null;

const sendMessageIfNotNull: SendMessage = (channel, ...args) => {
  if (sendMessage !== null) {
    sendMessage(channel, ...args);
  }
};

export const noticeApi = {
  initialize(deps: { sendMessage: SendMessage, closeWindow: () => void }) {
    if (isInitialized) {
      return;
    }

    sendMessage = deps.sendMessage;
    closeWindow = deps.closeWindow;

    ipcMain.on('accept-close', () => this.acceptClose());

    isInitialized = true;
  },

  createNotice(notice: Notice) {
    sendMessageIfNotNull('create-notice', notice);
  },

  showAppCloseConfirmDialog(text: string) {
    sendMessageIfNotNull('show-app-close-confirm-dialog', text);
  },

  acceptClose() {
    defeatCountApi.resetDefeatCount();
    closeWindow?.();
  },
} as const;
