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
  menu: import('./preload').MenuApi;
  setting: import('./preload').SettingApi;
  stats: import('./preload').StatsApi;
  preset: import('./preload').PresetApi;
}
