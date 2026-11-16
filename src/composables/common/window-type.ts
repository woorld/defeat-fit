import { OVERLAY_WINDOW_QUERY } from '@common/constants';

/** SteamVRオーバーレイ用のウィンドウで動作しているか（メインウィンドウと同じ画面を画面外で描画している） */
export const isOverlayWindow = Object.entries(OVERLAY_WINDOW_QUERY).every(
  ([key, value]) => new URLSearchParams(window.location.search).get(key) === value
);

/**
 * オーバーレイ用ウィンドウが破棄される直前か
 * 破棄前の画面遷移はユーザーの操作ではないため、遷移を確認ダイアログ等で止める画面はこれを見て素通しする
 */
export const overlayWindowState = { isClosing: false };
