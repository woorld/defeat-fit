/// <reference types="vite-plugin-electron/electron-env" />

declare namespace NodeJS {
  interface ProcessEnv {
    APP_ROOT: string;
    /** /dist/ or /public/ */
    VITE_PUBLIC: string;
  }
}

// Used in Renderer process, expose in `preload.ts`

interface Window {
  defeatCount: import('./preload').DefeatCountApi;
  osc: import('./preload').OscApi;
  menuList: import('./preload').MenuListApi;
  setting: import('./preload').SettingApi;
  statsList: import('./preload').StatsListApi;
  preset: import('./preload').PresetApi;
}
