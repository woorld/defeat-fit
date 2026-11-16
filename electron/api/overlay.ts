import { ipcMain, type IpcMainEvent, type WebContents } from 'electron';

const RENDERER_CLEANUP_TIMEOUT_MS = 1000;

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

  /**
   * オーバーレイ用ウィンドウのレンダラーに画面の後始末をさせ、完了（または時間切れ）を待つ
   * NOTE: ウィンドウをいきなり破棄するとonUnmounted等が呼ばれず、画面が一時的に変えたmain側の状態
   *       （カウンターの自動カウントや設定画面によるOSCの受信対象の切り替え）が戻らないまま残る
   */
  requestRendererCleanup(webContents: WebContents): Promise<void> {
    return new Promise(resolve => {
      const finish = () => {
        clearTimeout(timer);
        ipcMain.off('overlay-closed', onClosed);
        resolve();
      };
      const onClosed = (event: IpcMainEvent) => {
        if (event.sender === webContents) {
          finish();
        }
      };
      // レンダラーが読み込み中・応答不能でも、ウィンドウの破棄へ進めるようにする
      const timer = setTimeout(finish, RENDERER_CLEANUP_TIMEOUT_MS);

      ipcMain.on('overlay-closed', onClosed);
      webContents.send('overlay-closing');
    });
  },
} as const;
