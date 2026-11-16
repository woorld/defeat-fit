import { onUnmounted, watch, type Ref } from 'vue';
import type { OverlayHudImage } from '@common/types';

export type VrHudContent = {
  /** 大きく表示する値（残り秒数・回数） */
  value: string,
  caption: string,
  isBreakTime: boolean,
};

const WIDTH = 320;
const HEIGHT = 160;
const FONT_FAMILY = '"Noto Sans JP", sans-serif';

// NOTE: 視界への表示はmain側（OpenVR）が行うが、mainには文字を描画する手段がないため、レンダラーで画像にしてから渡す
const renderHud = (content: VrHudContent): OverlayHudImage => {
  const canvas = new OffscreenCanvas(WIDTH, HEIGHT);
  const context = canvas.getContext('2d')!; // 新規のキャンバスなので、他の種類のコンテキストと競合してnullになることはない

  // VRの映像に重なっても読めるよう、半透明の背景を敷く
  context.fillStyle = 'rgba(0, 0, 0, 0.6)';
  context.beginPath();
  context.roundRect(0, 0, WIDTH, HEIGHT, 24);
  context.fill();

  context.fillStyle = content.isBreakTime ? '#4CAF50' : '#FFFFFF';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.font = `26px ${FONT_FAMILY}`;
  context.fillText(content.caption, WIDTH / 2, 36, WIDTH - 24);
  context.font = `bold 84px ${FONT_FAMILY}`;
  context.fillText(content.value, WIDTH / 2, 102, WIDTH - 24);

  const { data } = context.getImageData(0, 0, WIDTH, HEIGHT);
  return { pixels: new Uint8Array(data.buffer), width: WIDTH, height: HEIGHT };
};

/**
 * SteamVRの視界の隅に、タイマー・カウンターの進行状況を表示する
 * contentがnullの間は表示しない
 */
export function useVrHud(content: Ref<VrHudContent | null>) {
  watch(content, (newContent) => {
    window.overlay.setHud(newContent === null ? null : renderHud(newContent));
  }, { immediate: true });

  onUnmounted(() => {
    window.overlay.setHud(null);
  });
}
