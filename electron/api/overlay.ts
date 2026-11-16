import { ipcMain } from 'electron';

let isInitialized = false;
// NOTE: 設定ファイルのスキーマ変更（SCHEMA_VERSIONの更新）を伴うため、現状は永続化せず起動中のみ保持する
let isPinned = true;

export const overlayApi = {
  initialize() {
    if (isInitialized) {
      return;
    }

    ipcMain.handle('is-overlay-pinned', () => this.isPinned());
    ipcMain.on('set-overlay-pinned', (_, newIsPinned: boolean) => this.setPinned(newIsPinned));

    isInitialized = true;
  },

  /** オーバーレイをダッシュボードの外（コントローラー）にも常時表示するか */
  isPinned() {
    return isPinned;
  },

  setPinned(newIsPinned: boolean) {
    isPinned = newIsPinned;
  },
} as const;
