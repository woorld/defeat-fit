import { BrowserWindow } from 'electron';
import { addBroadcastTarget } from '@electron/broadcast';
import { loadRenderer, PRELOAD_PATH } from '@electron/window';
import { OVERLAY_WINDOW_QUERY } from '@common/constants';

/** オーバーレイ用ウィンドウの論理サイズ。メインウィンドウの最小サイズ（画面が崩れない下限）に合わせる */
export const OVERLAY_WINDOW_SIZE = { width: 800, height: 600 } as const;

const FRAME_RATE = 30;

export type OverlayFrame = {
  /** BGRA（Electronのビットマップ形式）のピクセル列 */
  bitmap: Buffer,
  width: number,
  height: number,
};

/**
 * メインウィンドウと同じレンダラーを画面外で描画するウィンドウを生成する
 * 描画内容が変わるたびにonFrameが呼ばれる
 */
export const createOverlayWindow = (onFrame: (frame: OverlayFrame) => void) => {
  const win = new BrowserWindow({
    ...OVERLAY_WINDOW_SIZE,
    show: false,
    webPreferences: {
      preload: PRELOAD_PATH,
      offscreen: true,
      // NOTE: 非表示ウィンドウ扱いでタイマーが間引かれると、タイマー・カウンター画面の秒数がずれる
      backgroundThrottling: false,
    },
  });

  win.webContents.setFrameRate(FRAME_RATE);
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));

  win.webContents.on('paint', (_event, _dirty, image) => {
    const bitmap = image.toBitmap();
    const { width, height } = image.getSize();
    if (width <= 0 || height <= 0) {
      return;
    }

    // NOTE: getSize()は論理サイズを返すため、ディスプレイの拡大率によってはビットマップの実サイズと食い違う
    const scale = Math.sqrt(bitmap.length / 4 / (width * height));
    onFrame({
      bitmap,
      width: Math.round(width * scale),
      height: Math.round(height * scale),
    });
  });

  addBroadcastTarget(win.webContents);
  loadRenderer(win, OVERLAY_WINDOW_QUERY);

  return win;
};
