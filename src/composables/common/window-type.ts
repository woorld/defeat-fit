import { OVERLAY_WINDOW_QUERY } from '@common/constants';

/** SteamVRオーバーレイ用のウィンドウで動作しているか（メインウィンドウと同じ画面を画面外で描画している） */
export const isOverlayWindow = Object.entries(OVERLAY_WINDOW_QUERY).every(
  ([key, value]) => new URLSearchParams(window.location.search).get(key) === value
);
