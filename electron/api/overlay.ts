import { ipcMain, type IpcMainEvent, type WebContents } from 'electron';
import type { OverlayHudImage } from '@common/types';

const RENDERER_CLEANUP_TIMEOUT_MS = 1000;
/** 視界の隅に表示する画像の1辺の上限(px) */
const HUD_MAX_SIZE = 1024;

let isInitialized = false;
// NOTE: 設定ファイルのスキーマ変更（SCHEMA_VERSIONの更新）を伴うため、現状は永続化せず起動中のみ保持する
let isPinned = true;
/** 視界の隅に表示中の画像と、それを設定したウィンドウ */
let hud: { owner: WebContents, image: OverlayHudImage } | null = null;
/** hudが変わるたびに増える番号。オーバーレイ側が転送済みかどうかの判定に使う */
let hudRevision = 0;

// NOTE: 画像はそのままOpenVR(FFI)へ渡すため、申告されたサイズと画素列の長さが食い違うと範囲外のメモリを読ませてしまう
const isValidHudImage = (image: OverlayHudImage) =>
  Number.isInteger(image.width) && Number.isInteger(image.height)
  && image.width >= 1 && image.width <= HUD_MAX_SIZE
  && image.height >= 1 && image.height <= HUD_MAX_SIZE
  && image.pixels instanceof Uint8Array
  && image.pixels.length === image.width * image.height * 4;

/** 画面が消す機会を失う場面に備えた後始末を登録済みのウィンドウ */
const hudCleanupRegistered = new WeakSet<WebContents>();

/**
 * 表示したまま画面がなくなった場合に、表示を消す
 * NOTE: ウィンドウの破棄・リロード・レンダラーの異常終了ではonUnmountedが呼ばれず、画面側から消せない
 */
const registerHudCleanup = (owner: WebContents) => {
  // 表示のたびに登録すると、ウィンドウが生きている間リスナーが増え続ける
  if (hudCleanupRegistered.has(owner)) {
    return;
  }
  hudCleanupRegistered.add(owner);

  const clear = () => setHud(owner, null);
  owner.on('destroyed', clear);
  owner.on('render-process-gone', clear);
  owner.on('did-start-navigation', (details) => {
    if (details.isMainFrame && !details.isSameDocument) {
      clear();
    }
  });
};

const setHud = (owner: WebContents, image: OverlayHudImage | null) => {
  // NOTE: タイマー・カウンターはウィンドウごとに独立して動く。両方で同時に動かすと交互に上書きし合って
  //       表示がちらつくため、先に表示したウィンドウが消すまで、他のウィンドウからの変更は受け付けない
  if (hud !== null && hud.owner !== owner) {
    return;
  }

  if (image === null) {
    if (hud === null) {
      return;
    }
    hud = null;
  }
  else {
    if (!isValidHudImage(image)) {
      return;
    }
    registerHudCleanup(owner);
    hud = { owner, image };
  }
  hudRevision++;
};

export const overlayApi = {
  initialize() {
    if (isInitialized) {
      return;
    }

    ipcMain.handle('is-overlay-pinned', () => this.isPinned());
    ipcMain.on('set-overlay-pinned', (_, newIsPinned: boolean) => this.setPinned(newIsPinned));
    ipcMain.on('set-overlay-hud', (event, image: OverlayHudImage | null) => setHud(event.sender, image));

    isInitialized = true;
  },

  /** オーバーレイをダッシュボードの外（コントローラー）にも常時表示するか */
  isPinned() {
    return isPinned;
  },

  setPinned(newIsPinned: boolean) {
    isPinned = newIsPinned;
  },

  /** 視界の隅に表示する画像（表示しない場合はnull）と、その変更番号 */
  getHud() {
    return { image: hud?.image ?? null, revision: hudRevision };
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
