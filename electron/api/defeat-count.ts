import { ipcMain } from 'electron';
import type { SendMessage } from '@common/types';
import { noticeApi } from '@electron/api/notice';

let defeatCount = 0;
// NOTE: レンダラーの再読み込みや終了確認で失われないよう、OSCに無関係な自主カウントもmain側で保持する
let selfCount = 0;
let isInitialized = false;

export const defeatCountApi = {
  initialize(deps: { sendMessage: SendMessage }) {
    if (isInitialized) {
      return;
    }

    ipcMain.handle('get-defeat-count', () => this.getDefeatCount());
    ipcMain.handle('decrement-defeat-count', () => this.decrementDefeatCount());
    ipcMain.handle('get-self-count', () => this.getSelfCount());
    ipcMain.handle('increment-self-count', () => this.incrementSelfCount());
    ipcMain.handle('decrement-self-count', () => this.decrementSelfCount());
    ipcMain.handle('reset-self-count', () => this.resetSelfCount());
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

  getSelfCount() {
    return selfCount;
  },

  incrementSelfCount() {
    return ++selfCount;
  },

  decrementSelfCount() {
    return selfCount >= 1 ? --selfCount : selfCount;
  },

  resetSelfCount() {
    selfCount = 0;
    return selfCount;
  },
} as const;
