import { app, BrowserWindow, type NativeImage } from 'electron';
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

/** 描画結果をピクセル列に変換する。描画できていない（サイズが0の）場合はnull */
export const toOverlayFrame = (image: NativeImage): OverlayFrame | null => {
  const { width, height } = image.getSize();
  if (width <= 0 || height <= 0) {
    return null;
  }

  const bitmap = image.toBitmap();
  // NOTE: getSize()は論理サイズを返すため、ディスプレイの拡大率によってはビットマップの実サイズと食い違う
  const scale = Math.sqrt(bitmap.length / 4 / (width * height));
  return {
    bitmap,
    width: Math.round(width * scale),
    height: Math.round(height * scale),
  };
};

/**
 * メインウィンドウと同じレンダラーを画面外で描画するウィンドウを生成する
 * 描画内容が変わるたびにonPaintが呼ばれる
 * NOTE: ピクセル列への変換（toOverlayFrame）は1回ごとに全画素をコピーするため、
 *       ここでは行わず、実際に転送するときまで呼び出し側に遅らせる
 */
export const createOverlayWindow = (onPaint: (image: NativeImage) => void) => {
  const win = new BrowserWindow({
    ...OVERLAY_WINDOW_SIZE,
    show: false,
    webPreferences: {
      preload: PRELOAD_PATH,
      devTools: !app.isPackaged,
      offscreen: true,
      // NOTE: 非表示ウィンドウ扱いでタイマーが間引かれると、タイマー・カウンター画面の秒数がずれる
      backgroundThrottling: false,
    },
  });

  win.webContents.setFrameRate(FRAME_RATE);
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));

  win.webContents.on('paint', (_event, _dirty, image) => onPaint(image));

  addBroadcastTarget(win.webContents);
  loadRenderer(win, OVERLAY_WINDOW_QUERY);

  return win;
};
