// OpenVR(openvr_api.dll)のうち、オーバーレイに必要な関数だけを包んだバインディング
// 定義の出典: OpenVR SDK v2.15.6 の headers/openvr_capi.h

type Koffi = typeof import('koffi')['default'];

export type OverlayHandle = number | bigint;

export type VrEvent = {
  type: number,
  /** マウス系イベントの座標（SetOverlayMouseScaleで指定した範囲）、スクロール系イベントの移動量 */
  x: number,
  y: number,
  button: number,
};

export const VR_EVENT_TYPE = {
  MOUSE_MOVE: 300,
  MOUSE_BUTTON_DOWN: 301,
  MOUSE_BUTTON_UP: 302,
  FOCUS_LEAVE: 304,
  SCROLL_DISCRETE: 305,
  QUIT: 700,
} as const;

export const VR_MOUSE_BUTTON_LEFT = 1;

const VR_APPLICATION_BACKGROUND = 3;
const VR_OVERLAY_INPUT_METHOD_MOUSE = 1;
const VR_OVERLAY_FLAG_SEND_DISCRETE_SCROLL_EVENTS = 64;
const VR_TRACKED_CONTROLLER_ROLE_LEFT_HAND = 1;
const VR_TRACKED_DEVICE_INDEX_INVALID = 0xFFFFFFFF;
/** Windows(x64)でのsizeof(VREvent_t)。dataはオフセット16から始まる */
const VR_EVENT_SIZE = 64;
const VR_EVENT_DATA_OFFSET = 16;

type FnDefinition = readonly [index: number, result: string, params: string];

// NOTE: 関数テーブルの並びはインターフェースバージョンごとに固定で、SteamVRは古いバージョンも提供し続ける
//       同梱するDLLを更新してもここを変える必要はない（バージョンを上げる場合のみ、ヘッダーの構造体の並びからindexを取り直す）
const SYSTEM_INTERFACE = 'FnTable:IVRSystem_026';
const SYSTEM_FUNCTIONS = {
  GetTrackedDeviceIndexForControllerRole: [18, 'uint32_t', 'int32_t role'],
  PollNextEvent: [30, 'bool', '_Out_ uint8_t *event, uint32_t eventSize'],
} as const satisfies Record<string, FnDefinition>;

const OVERLAY_INTERFACE = 'FnTable:IVROverlay_028';
const OVERLAY_FUNCTIONS = {
  CreateOverlay: [1, 'int32_t', 'const char *key, const char *name, _Out_ uint64_t *handle'],
  DestroyOverlay: [3, 'int32_t', 'uint64_t handle'],
  SetOverlayFlag: [11, 'int32_t', 'uint64_t handle, int32_t flag, bool enabled'],
  SetOverlayWidthInMeters: [22, 'int32_t', 'uint64_t handle, float width'],
  SetOverlayTransformTrackedDeviceRelative: [35, 'int32_t', 'uint64_t handle, uint32_t device, const float *matrix'],
  ShowOverlay: [43, 'int32_t', 'uint64_t handle'],
  HideOverlay: [44, 'int32_t', 'uint64_t handle'],
  IsOverlayVisible: [45, 'bool', 'uint64_t handle'],
  PollNextOverlayEvent: [48, 'bool', 'uint64_t handle, _Out_ uint8_t *event, uint32_t eventSize'],
  SetOverlayInputMethod: [50, 'int32_t', 'uint64_t handle, int32_t method'],
  SetOverlayMouseScale: [52, 'int32_t', 'uint64_t handle, const float *scale'],
  SetOverlayRaw: [62, 'int32_t', 'uint64_t handle, const uint8_t *buffer, uint32_t width, uint32_t height, uint32_t bytesPerPixel'],
  CreateDashboardOverlay: [67, 'int32_t', 'const char *key, const char *name, _Out_ uint64_t *mainHandle, _Out_ uint64_t *thumbnailHandle'],
} as const satisfies Record<string, FnDefinition>;

type Table<T> = Record<keyof T, (...args: any[]) => any>;

export class OpenVrError extends Error {
  constructor(functionName: string, public readonly code: number) {
    super(`OpenVR: ${functionName} failed (${code})`);
  }
}

export type OpenVr = ReturnType<typeof createOpenVr>;

const createOpenVr = (koffi: Koffi, dllPath: string) => {
  const lib = koffi.load(dllPath);
  const initInternal = lib.func('intptr_t VR_InitInternal(_Out_ int32_t *error, int32_t applicationType)');
  const shutdownInternal = lib.func('void VR_ShutdownInternal()');
  const getGenericInterface = lib.func('void *VR_GetGenericInterface(const char *interfaceVersion, _Out_ int32_t *error)');

  const defineTable = <T extends Record<string, FnDefinition>>(prefix: string, definitions: T) => {
    const protos = Object.entries(definitions).map(([name, [index, result, params]]) => ({
      name,
      index,
      proto: koffi.proto(`${result} ${prefix}_${name}(${params})`),
    }));
    const tableLength = Math.max(...protos.map(p => p.index)) + 1;

    return (interfaceVersion: string): Table<T> => {
      const error = [0];
      const tablePointer = getGenericInterface(interfaceVersion, error);
      if (error[0] !== 0 || !tablePointer) {
        throw new OpenVrError(`VR_GetGenericInterface(${interfaceVersion})`, error[0]);
      }

      const functionPointers: unknown[] = koffi.decode(tablePointer, 'void *', tableLength);
      const table: Record<string, (...args: any[]) => any> = {};
      for (const { name, index, proto } of protos) {
        table[name] = (...args) => koffi.call(functionPointers[index], proto, ...args);
      }
      return table as Table<T>;
    };
  };

  const bindSystem = defineTable('IVRSystem', SYSTEM_FUNCTIONS);
  const bindOverlay = defineTable('IVROverlay', OVERLAY_FUNCTIONS);

  let system: Table<typeof SYSTEM_FUNCTIONS> | null = null;
  let overlay: Table<typeof OVERLAY_FUNCTIONS> | null = null;
  const eventBuffer = Buffer.alloc(VR_EVENT_SIZE);

  const getTables = () => {
    if (system === null || overlay === null) {
      throw new Error('OpenVR: not initialized');
    }
    return { system, overlay };
  };

  /** EVROverlayErrorを返す関数を呼び、失敗時は例外にする */
  const callOverlay = <K extends keyof typeof OVERLAY_FUNCTIONS>(name: K, ...args: unknown[]) => {
    const error = getTables().overlay[name](...args);
    if (error !== 0) {
      throw new OpenVrError(name, error);
    }
  };

  const readEvent = (): VrEvent => ({
    type: eventBuffer.readUInt32LE(0),
    x: eventBuffer.readFloatLE(VR_EVENT_DATA_OFFSET),
    y: eventBuffer.readFloatLE(VR_EVENT_DATA_OFFSET + 4),
    button: eventBuffer.readUInt32LE(VR_EVENT_DATA_OFFSET + 8),
  });

  return {
    /**
     * SteamVRに接続する。SteamVRが起動していない等で接続できなければエラーコードを返す
     * NOTE: VRApplication_Overlayだと未起動のSteamVRを起動してしまうため、起動済みの場合だけ接続できるBackgroundを使う
     */
    init(): { ok: true } | { ok: false, code: number } {
      const error = [0];
      initInternal(error, VR_APPLICATION_BACKGROUND);
      if (error[0] !== 0) {
        return { ok: false, code: error[0] };
      }

      try {
        system = bindSystem(SYSTEM_INTERFACE);
        overlay = bindOverlay(OVERLAY_INTERFACE);
      }
      catch (e) {
        this.shutdown();
        throw e;
      }
      return { ok: true };
    },

    shutdown() {
      system = null;
      overlay = null;
      shutdownInternal();
    },

    pollNextEvent(): VrEvent | null {
      return getTables().system.PollNextEvent(eventBuffer, VR_EVENT_SIZE) ? readEvent() : null;
    },

    pollNextOverlayEvent(handle: OverlayHandle): VrEvent | null {
      return getTables().overlay.PollNextOverlayEvent(handle, eventBuffer, VR_EVENT_SIZE) ? readEvent() : null;
    },

    getLeftHandDeviceIndex(): number | null {
      const index = getTables().system.GetTrackedDeviceIndexForControllerRole(VR_TRACKED_CONTROLLER_ROLE_LEFT_HAND);
      return index === VR_TRACKED_DEVICE_INDEX_INVALID ? null : index;
    },

    createOverlay(key: string, name: string): OverlayHandle {
      const handle: OverlayHandle[] = [0];
      callOverlay('CreateOverlay', key, name, handle);
      return handle[0];
    },

    createDashboardOverlay(key: string, name: string): { main: OverlayHandle, thumbnail: OverlayHandle } {
      const main: OverlayHandle[] = [0];
      const thumbnail: OverlayHandle[] = [0];
      callOverlay('CreateDashboardOverlay', key, name, main, thumbnail);
      return { main: main[0], thumbnail: thumbnail[0] };
    },

    destroyOverlay(handle: OverlayHandle) {
      callOverlay('DestroyOverlay', handle);
    },

    setOverlayWidthInMeters(handle: OverlayHandle, width: number) {
      callOverlay('SetOverlayWidthInMeters', handle, width);
    },

    /** レーザーポインターでの操作を有効にし、座標を width × height の範囲で受け取る */
    enableMouseInput(handle: OverlayHandle, width: number, height: number) {
      callOverlay('SetOverlayInputMethod', handle, VR_OVERLAY_INPUT_METHOD_MOUSE);
      callOverlay('SetOverlayMouseScale', handle, new Float32Array([width, height]));
      callOverlay('SetOverlayFlag', handle, VR_OVERLAY_FLAG_SEND_DISCRETE_SCROLL_EVENTS, true);
    },

    /** matrixはHmdMatrix34_t（3行4列、行優先） */
    setOverlayTransformTrackedDeviceRelative(handle: OverlayHandle, deviceIndex: number, matrix: Float32Array) {
      callOverlay('SetOverlayTransformTrackedDeviceRelative', handle, deviceIndex, matrix);
    },

    showOverlay(handle: OverlayHandle) {
      callOverlay('ShowOverlay', handle);
    },

    hideOverlay(handle: OverlayHandle) {
      callOverlay('HideOverlay', handle);
    },

    isOverlayVisible(handle: OverlayHandle): boolean {
      return getTables().overlay.IsOverlayVisible(handle);
    },

    setOverlayRaw(handle: OverlayHandle, rgba: Buffer, width: number, height: number) {
      callOverlay('SetOverlayRaw', handle, rgba, width, height, 4);
    },
  };
};

/**
 * NOTE: koffiを静的importすると、ネイティブモジュールの読み込み失敗でアプリ自体が起動しなくなる
 *       オーバーレイが使えないだけで済むよう、ここで動的に読み込む
 */
export const loadOpenVr = async (dllPath: string): Promise<OpenVr> => {
  const { default: koffi } = await import('koffi');
  return createOpenVr(koffi, dllPath);
};
