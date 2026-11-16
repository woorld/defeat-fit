import { ipcMain } from 'electron';
import type { SendMessage } from '@common/types';
import { noticeApi } from '@electron/api/notice';

let defeatCount = 0;
let isInitialized = false;

export const defeatCountApi = {
  initialize(deps: { sendMessage: SendMessage }) {
    if (isInitialized) {
      return;
    }

    ipcMain.handle('get-defeat-count', () => this.getDefeatCount());
    ipcMain.handle('decrement-defeat-count', () => {
      const newCount = this.decrementDefeatCount();
      // 操作元以外のウィンドウ（SteamVRオーバーレイ等）にも反映する
      deps.sendMessage('update-defeat-count', newCount);
      return newCount;
    });
    ipcMain.on('reset-defeat-count', () => {
      this.resetDefeatCount();
      deps.sendMessage('update-defeat-count', this.getDefeatCount());
    });

    isInitialized = true;
  },

  getDefeatCount() {
    return defeatCount;
  },

  incrementDefeatCount() {
    return ++defeatCount;
  },

  decrementDefeatCount() {
    const newCount = defeatCount >= 1 ? --defeatCount : defeatCount;

    noticeApi.createNotice({
      text: 'カウントを-1しました',
      color: 'success',
    });

    return newCount;
  },

  resetDefeatCount() {
    defeatCount = 0;
  },
} as const;
