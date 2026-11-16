import { app, type BrowserWindow, type NativeImage } from 'electron';
import path from 'node:path';
import { overlayApi } from '@electron/api/overlay';
import { loadOpenVr, VR_EVENT_TYPE, VR_MOUSE_BUTTON_LEFT, type OpenVr, type OverlayHandle, type VrEvent } from '@electron/overlay/openvr';
import { createOverlayWindow, OVERLAY_WINDOW_SIZE, toOverlayFrame, type OverlayFrame } from '@electron/overlay/overlay-window';

const OVERLAY_KEY = 'com.github.woorld.defeatfit';
const OVERLAY_NAME = 'DefeatFit';

/** SteamVRの起動を確認する間隔 */
const PROBE_INTERVAL_MS = 5000;
/** 切断後、SteamVRの終了処理が終わるまで再接続を待つ時間 */
const RECONNECT_DELAY_MS = 15000;
const TICK_INTERVAL_MS = 20;
/** 左手コントローラーの接続状況を確認し直す間隔（tick数） */
const DEVICE_REFRESH_TICKS = 50;
/** VRInitError_Init_NoServerForBackgroundApp: SteamVRが起動していない（通常の状態） */
const INIT_ERROR_NO_SERVER = 121;

const DASHBOARD_WIDTH_METERS = 1.5;
const PINNED_WIDTH_METERS = 0.25;
/**
 * 常時表示オーバーレイの、左手コントローラーから見た位置と向き（HmdMatrix34_t）
 * コントローラーの上に、表示面を上向き・画面の上辺を奥側にして置く
 */
const PINNED_TRANSFORM = new Float32Array([
  1, 0, 0, 0,
  0, 0, 1, 0.06,
  0, -1, 0, 0.08,
]);

/** HMDのデバイス番号（k_unTrackedDeviceIndex_Hmd） */
const HMD_DEVICE_INDEX = 0;
const HUD_WIDTH_METERS = 0.25;
/**
 * タイマー・カウンターの進行状況を出すオーバーレイの、HMDから見た位置（HmdMatrix34_t）
 * 視界の右上、1m先に正面向きで置く
 * NOTE: これ以上外側に寄せると、レンズの周辺で文字がぼやけて読みにくくなる
 */
const HUD_TRANSFORM = new Float32Array([
  1, 0, 0, 0.35,
  0, 1, 0, 0.25,
  0, 0, 1, -1,
]);

/**
 * 右手コントローラーが常時表示オーバーレイを指しているとみなす範囲
 * NOTE: コントローラーの向きとレーザーの向きは機種ごとにずれるため、厳密な当たり判定ではなく余裕を持たせた円錐で判定する
 */
const POINTING_MAX_ANGLE_COS = Math.cos(30 * Math.PI / 180);
/**
 * 操作可能にした後、解除するまでの範囲
 * NOTE: 有効化と同じ角度で解除すると、境界付近で手がわずかに揺れるだけでレーザーが点滅する
 */
const POINTING_RELEASE_ANGLE_COS = Math.cos(40 * Math.PI / 180);
const POINTING_MAX_DISTANCE_METERS = 1;

/** スクロール1段階あたりの移動量(px) */
const SCROLL_STEP = 100;

type Session = {
  dashboard: OverlayHandle,
  thumbnail: OverlayHandle,
  pinned: OverlayHandle,
  hud: OverlayHandle,
  /** 転送済みのHUDの変更番号（overlayApi.getHud().revision） */
  hudRevision: number | null,
  isHudShown: boolean,
  window: BrowserWindow,
  /** 最新の描画結果のうち、まだピクセル列に変換していないもの */
  paintedImage: NativeImage | null,
  /** 最後に変換した描画結果（RGBA） */
  frame: OverlayFrame | null,
  /** オーバーレイ用ウィンドウに描画させているか。どのオーバーレイも見えていない間は止める */
  isPainting: boolean,
  shouldUploadDashboard: boolean,
  shouldUploadPinned: boolean,
  hasUploadedDashboard: boolean,
  /** 常時表示オーバーレイを取り付けているデバイス。非表示中はnull */
  pinnedDevice: number | null,
  isPinnedInteractive: boolean,
  /** レーザーポインターが常時表示オーバーレイに当たっているか */
  isPinnedHovered: boolean,
  tickCount: number,
  mouse: { x: number, y: number },
  isMouseDown: boolean,
};

let openVr: OpenVr | null = null;
let session: Session | null = null;
let probeTimer: NodeJS.Timeout | null = null;
let tickTimer: NodeJS.Timeout | null = null;
let isStarted = false;
let lastInitErrorCode = INIT_ERROR_NO_SERVER;

const getDllPath = () => app.isPackaged
  ? path.join(process.resourcesPath, 'openvr', 'openvr_api.dll')
  : path.join(process.env.APP_ROOT, 'vendor', 'openvr', 'openvr_api.dll');

const swapRedAndBlue = (pixels: Buffer) => {
  for (let i = 0; i < pixels.length; i += 4) {
    const blue = pixels[i];
    pixels[i] = pixels[i + 2];
    pixels[i + 2] = blue;
  }
};

const scheduleProbe = (delayMs: number) => {
  if (!isStarted) {
    return;
  }
  probeTimer = setTimeout(probe, delayMs);
};

const probe = () => {
  probeTimer = null;
  if (openVr === null || session !== null) {
    return;
  }

  try {
    const result = openVr.init();
    if (!result.ok) {
      if (result.code !== lastInitErrorCode && result.code !== INIT_ERROR_NO_SERVER) {
        console.warn(`DefeatFit: SteamVRに接続できません (VRInitError ${result.code})`);
      }
      lastInitErrorCode = result.code;
      scheduleProbe(PROBE_INTERVAL_MS);
      return;
    }
    lastInitErrorCode = INIT_ERROR_NO_SERVER;
  }
  catch (e) {
    console.error('DefeatFit: SteamVRへの接続に失敗しました: ', e);
    scheduleProbe(PROBE_INTERVAL_MS);
    return;
  }

  try {
    connect(openVr);
  }
  catch (e) {
    console.error('DefeatFit: SteamVRオーバーレイの作成に失敗しました: ', e);
    disconnect();
  }
};

const connect = (vr: OpenVr) => {
  const { main: dashboard, thumbnail } = vr.createDashboardOverlay(`${OVERLAY_KEY}.dashboard`, OVERLAY_NAME);
  const pinned = vr.createOverlay(`${OVERLAY_KEY}.pinned`, `${OVERLAY_NAME} (常時表示)`);
  const hud = vr.createOverlay(`${OVERLAY_KEY}.hud`, `${OVERLAY_NAME} (タイマー・カウンター)`);

  const newSession: Session = {
    dashboard,
    thumbnail,
    pinned,
    hud,
    hudRevision: null,
    isHudShown: false,
    window: createOverlayWindow(image => {
      newSession.paintedImage = image;
      newSession.shouldUploadDashboard = true;
      newSession.shouldUploadPinned = true;
    }),
    paintedImage: null,
    frame: null,
    isPainting: true,
    shouldUploadDashboard: false,
    shouldUploadPinned: false,
    hasUploadedDashboard: false,
    pinnedDevice: null,
    isPinnedInteractive: false,
    isPinnedHovered: false,
    tickCount: 0,
    mouse: { x: 0, y: 0 },
    isMouseDown: false,
  };
  // NOTE: 以降で例外が起きてもdisconnect()がウィンドウ・オーバーレイを片付けられるよう、先にセッションを確定させる
  session = newSession;

  newSession.window.on('closed', () => {
    if (session === newSession) {
      disconnect();
    }
  });

  vr.setOverlayWidthInMeters(dashboard, DASHBOARD_WIDTH_METERS);
  vr.enableMouseInput(dashboard, OVERLAY_WINDOW_SIZE.width, OVERLAY_WINDOW_SIZE.height);
  vr.setOverlayWidthInMeters(pinned, PINNED_WIDTH_METERS);
  vr.enableMouseInput(pinned, OVERLAY_WINDOW_SIZE.width, OVERLAY_WINDOW_SIZE.height);
  vr.setOverlayWidthInMeters(hud, HUD_WIDTH_METERS);
  vr.setOverlayTransformTrackedDeviceRelative(hud, HMD_DEVICE_INDEX, HUD_TRANSFORM);
  setThumbnail(vr, newSession);

  tickTimer = setInterval(tick, TICK_INTERVAL_MS);
};

const setThumbnail = async (vr: OpenVr, targetSession: Session) => {
  try {
    const icon = await app.getFileIcon(process.execPath, { size: 'large' });
    if (session !== targetSession) {
      return;
    }

    const { width, height } = icon.getSize();
    const pixels = icon.toBitmap({ scaleFactor: 1 });
    swapRedAndBlue(pixels);
    vr.setOverlayRaw(targetSession.thumbnail, pixels, width, height);
  }
  catch (e) {
    // サムネイルが出ないだけで操作には支障がないため、接続は維持する
    console.warn('DefeatFit: オーバーレイのサムネイル設定に失敗しました: ', e);
  }
};

const closeOverlayWindow = async (window: BrowserWindow) => {
  if (window.isDestroyed()) {
    return;
  }

  await overlayApi.requestRendererCleanup(window.webContents);
  if (!window.isDestroyed()) {
    window.destroy();
  }
};

const disconnect = () => {
  if (tickTimer !== null) {
    clearInterval(tickTimer);
    tickTimer = null;
  }

  const closingSession = session;
  session = null;

  if (closingSession !== null) {
    // NOTE: SteamVRとの切断は待たせられない（終了時に巻き込まれる）ため、ウィンドウの後始末だけ非同期で進める
    closeOverlayWindow(closingSession.window);

    for (const handle of [closingSession.hud, closingSession.pinned, closingSession.dashboard]) {
      try {
        openVr?.destroyOverlay(handle);
      }
      catch (e) {
        // SteamVRが先に終了している場合は破棄できないが、接続ごと閉じるため問題ない
      }
    }
  }

  try {
    openVr?.shutdown();
  }
  catch (e) {
    console.error('DefeatFit: SteamVRとの切断に失敗しました: ', e);
  }

  scheduleProbe(RECONNECT_DELAY_MS);
};

const tick = () => {
  if (openVr === null || session === null) {
    return;
  }

  try {
    let event: VrEvent | null;
    while ((event = openVr.pollNextEvent()) !== null) {
      if (event.type === VR_EVENT_TYPE.QUIT) {
        // NOTE: SteamVRの終了時、接続したままのプロセスは強制終了され得るため、即座に切断する
        disconnect();
        return;
      }
    }

    for (const handle of [session.dashboard, session.pinned]) {
      while ((event = openVr.pollNextOverlayEvent(handle)) !== null) {
        if (handle === session.pinned) {
          trackPinnedHover(session, event);
        }
        forwardInput(session, event);
      }
    }

    updatePinnedOverlay(openVr, session);
    updatePinnedInteractivity(openVr, session);
    updateHud(openVr, session);

    const isDashboardVisible = openVr.isOverlayVisible(session.dashboard);
    updatePainting(session, isDashboardVisible);
    uploadFrame(openVr, session, isDashboardVisible);
    session.tickCount++;
  }
  catch (e) {
    console.error('DefeatFit: SteamVRオーバーレイの更新に失敗しました: ', e);
    disconnect();
  }
};

/** レーザーポインターの操作を、オーバーレイ用ウィンドウへのマウス操作として転送する */
const forwardInput = (currentSession: Session, event: VrEvent) => {
  const { webContents } = currentSession.window;
  const { mouse } = currentSession;

  const updateMousePosition = () => {
    mouse.x = Math.round(event.x);
    // NOTE: OpenVRのマウス座標は左下原点のため、左上原点に変換する
    mouse.y = Math.round(OVERLAY_WINDOW_SIZE.height - event.y);
  };

  switch (event.type) {
    case VR_EVENT_TYPE.MOUSE_MOVE:
      updateMousePosition();
      webContents.sendInputEvent({ type: 'mouseMove', ...mouse });
      return;
    case VR_EVENT_TYPE.MOUSE_BUTTON_DOWN:
    case VR_EVENT_TYPE.MOUSE_BUTTON_UP:
      if (event.button !== VR_MOUSE_BUTTON_LEFT) {
        return;
      }
      updateMousePosition();
      currentSession.isMouseDown = event.type === VR_EVENT_TYPE.MOUSE_BUTTON_DOWN;
      webContents.sendInputEvent({
        type: currentSession.isMouseDown ? 'mouseDown' : 'mouseUp',
        button: 'left',
        clickCount: 1,
        ...mouse,
      });
      return;
    case VR_EVENT_TYPE.FOCUS_LEAVE:
      if (currentSession.isMouseDown) {
        // NOTE: 押したままレーザーが外れるとボタンを離したイベントが届かず、押下状態（スライダーのドラッグ等）が残る
        //       元の位置で離すとクリックが成立してしまうため、画面の外で離したことにする
        currentSession.isMouseDown = false;
        webContents.sendInputEvent({ type: 'mouseUp', button: 'left', clickCount: 1, x: -1, y: -1 });
      }
      webContents.sendInputEvent({ type: 'mouseLeave', ...mouse });
      return;
    case VR_EVENT_TYPE.SCROLL_DISCRETE:
      webContents.sendInputEvent({
        type: 'mouseWheel',
        deltaX: event.x * SCROLL_STEP,
        deltaY: event.y * SCROLL_STEP,
        ...mouse,
      });
      return;
    default:
      return;
  }
};

/** 常時表示の設定と左手コントローラーの接続状況に合わせ、常時表示オーバーレイを表示・非表示にする */
const updatePinnedOverlay = (vr: OpenVr, currentSession: Session) => {
  const isPinned = overlayApi.isPinned();
  const isShown = currentSession.pinnedDevice !== null;
  if (isPinned === isShown && currentSession.tickCount % DEVICE_REFRESH_TICKS !== 0) {
    return;
  }

  const device = isPinned ? vr.getLeftHandDeviceIndex() : null;
  if (device === currentSession.pinnedDevice) {
    return;
  }

  if (device === null) {
    vr.hideOverlay(currentSession.pinned);
  }
  else {
    vr.setOverlayTransformTrackedDeviceRelative(currentSession.pinned, device, PINNED_TRANSFORM);
    vr.showOverlay(currentSession.pinned);
    // 非表示中は転送を省いているため、表示し直す際に最新の描画を送る
    currentSession.shouldUploadPinned = true;
  }
  currentSession.pinnedDevice = device;
};

/**
 * レーザーポインターが常時表示オーバーレイに当たっているかを記録する
 * NOTE: IVROverlay::IsHoverTargetOverlayは「最後に当たったオーバーレイ」を返し、レーザーが外れた後もtrueのままになるため使えない
 */
const trackPinnedHover = (currentSession: Session, event: VrEvent) => {
  if (event.type === VR_EVENT_TYPE.FOCUS_ENTER) {
    currentSession.isPinnedHovered = true;
  }
  else if (event.type === VR_EVENT_TYPE.FOCUS_LEAVE) {
    currentSession.isPinnedHovered = false;
  }
};

/** 右手コントローラーが、左手コントローラー上の常時表示オーバーレイの方を向いているか（maxAngleCosは許容する角度の余弦） */
const isRightHandPointingAtPinned = (vr: OpenVr, leftDevice: number, maxAngleCos: number) => {
  const rightDevice = vr.getRightHandDeviceIndex();
  const left = vr.getDevicePose(leftDevice);
  const right = rightDevice === null ? null : vr.getDevicePose(rightDevice);
  if (left === null || right === null) {
    return false;
  }

  // HmdMatrix34_tは行優先で、各行の4列目が位置。コントローラーの正面は-Z方向
  const offset = [PINNED_TRANSFORM[3], PINNED_TRANSFORM[7], PINNED_TRANSFORM[11]];
  const toOverlay = [0, 1, 2].map(row =>
    left[row * 4] * offset[0] + left[row * 4 + 1] * offset[1] + left[row * 4 + 2] * offset[2] + left[row * 4 + 3]
    - right[row * 4 + 3],
  );
  const distance = Math.hypot(...toOverlay);
  if (distance === 0 || distance > POINTING_MAX_DISTANCE_METERS) {
    return false;
  }

  const forward = [-right[2], -right[6], -right[10]];
  const cos = (forward[0] * toOverlay[0] + forward[1] * toOverlay[1] + forward[2] * toOverlay[2]) / distance;
  return cos >= maxAngleCos;
};

/**
 * 常時表示オーバーレイを、右手コントローラーで指している間だけレーザーポインターで操作できるようにする
 * NOTE: 操作可能にしている間はSteamVR全体がレーザー操作のモードになり、VRアプリの操作を妨げ得るため、
 *       表示中ずっと操作可能にはしない
 */
const updatePinnedInteractivity = (vr: OpenVr, currentSession: Session) => {
  const { pinned, pinnedDevice } = currentSession;
  const maxAngleCos = currentSession.isPinnedInteractive ? POINTING_RELEASE_ANGLE_COS : POINTING_MAX_ANGLE_COS;
  // レーザーが当たっている間は、手の向きが判定範囲から外れても操作を続けられるようにする
  const isInteractive = pinnedDevice !== null && (
    isRightHandPointingAtPinned(vr, pinnedDevice, maxAngleCos)
    || (currentSession.isPinnedInteractive && currentSession.isPinnedHovered)
  );
  if (isInteractive === currentSession.isPinnedInteractive) {
    return;
  }

  vr.setOverlayInteractive(pinned, isInteractive);
  currentSession.isPinnedInteractive = isInteractive;
  // 操作できなくした後は外れたイベントが届く保証がないため、当たっていない状態に戻しておく
  currentSession.isPinnedHovered = false;
};

/** タイマー・カウンターの進行状況（レンダラーが画像にして渡してくる）を、視界の隅のオーバーレイに反映する */
const updateHud = (vr: OpenVr, currentSession: Session) => {
  const { image, revision } = overlayApi.getHud();
  if (revision === currentSession.hudRevision) {
    return;
  }
  currentSession.hudRevision = revision;

  if (image === null) {
    if (currentSession.isHudShown) {
      vr.hideOverlay(currentSession.hud);
      currentSession.isHudShown = false;
    }
    return;
  }

  vr.setOverlayRaw(currentSession.hud, image.pixels, image.width, image.height);
  if (!currentSession.isHudShown) {
    vr.showOverlay(currentSession.hud);
    currentSession.isHudShown = true;
  }
};

/** どのオーバーレイも見えていない間は、オーバーレイ用ウィンドウの描画を止める */
const updatePainting = (currentSession: Session, isDashboardVisible: boolean) => {
  // NOTE: ダッシュボードは開くまで見えないが、開いた瞬間に空で表示されないよう初回の転送までは描画させる
  const needsPainting = isDashboardVisible
    || currentSession.pinnedDevice !== null
    || !currentSession.hasUploadedDashboard;
  if (needsPainting === currentSession.isPainting) {
    return;
  }

  const { webContents } = currentSession.window;
  if (needsPainting) {
    webContents.startPainting();
    // 止めていた間の変更を反映させるため、描画し直させる
    webContents.invalidate();
  }
  else {
    webContents.stopPainting();
  }
  currentSession.isPainting = needsPainting;
};

/** 描画内容に変更があれば、表示中のオーバーレイへ転送する */
const uploadFrame = (vr: OpenVr, currentSession: Session, isDashboardVisible: boolean) => {
  const uploadsDashboard = currentSession.shouldUploadDashboard
    && (!currentSession.hasUploadedDashboard || isDashboardVisible);
  const uploadsPinned = currentSession.shouldUploadPinned && currentSession.pinnedDevice !== null;
  if (!uploadsDashboard && !uploadsPinned) {
    return;
  }

  if (currentSession.paintedImage !== null) {
    const newFrame = toOverlayFrame(currentSession.paintedImage);
    currentSession.paintedImage = null;
    if (newFrame !== null) {
      swapRedAndBlue(newFrame.bitmap);
      currentSession.frame = newFrame;
    }
  }

  const { frame } = currentSession;
  if (frame === null) {
    return;
  }

  if (uploadsDashboard) {
    vr.setOverlayRaw(currentSession.dashboard, frame.bitmap, frame.width, frame.height);
    currentSession.shouldUploadDashboard = false;
    currentSession.hasUploadedDashboard = true;
  }
  if (uploadsPinned) {
    vr.setOverlayRaw(currentSession.pinned, frame.bitmap, frame.width, frame.height);
    currentSession.shouldUploadPinned = false;
  }
};

export const steamVrOverlay = {
  /** SteamVRの起動を監視し、起動中はオーバーレイを表示する。OpenVRを読み込めない環境では何もしない */
  async start() {
    if (isStarted) {
      return;
    }
    isStarted = true;

    try {
      openVr = await loadOpenVr(getDllPath());
    }
    catch (e) {
      console.warn('DefeatFit: OpenVRを読み込めないため、SteamVRオーバーレイを無効にします: ', e);
      isStarted = false;
      return;
    }

    scheduleProbe(0);
  },

  stop() {
    if (!isStarted) {
      return;
    }
    isStarted = false;

    if (probeTimer !== null) {
      clearTimeout(probeTimer);
      probeTimer = null;
    }
    if (session !== null) {
      disconnect();
    }
  },
} as const;
