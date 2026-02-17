import { ipcRenderer, contextBridge } from 'electron';
import type { License, MenuIdWithMultiplier, Notice, OscStatus, PresetWithMenus, Setting, StatsWithMenus, TotalStats } from '@common/types';
import type { Menu, Stats, Preset } from '@prisma-generated-client';
import type { UpdatePreset } from '@electron/api/preset';

const defeatCountApi = {
  onUpdateDefeatCount: (callback: (defeatCount: number) => void) =>
    ipcRenderer.on('update-defeat-count', (_, defeatCount: number) => callback(defeatCount)),
  getDefeatCount: (): Promise<number> =>
    ipcRenderer.invoke('get-defeat-count'),
  decrementDefeatCount: (): Promise<number> =>
    ipcRenderer.invoke('decrement-defeat-count'),
  resetDefeatCount: () =>
    ipcRenderer.send('reset-defeat-count'),
} as const;

const oscApi = {
  getOscStatus: (): Promise<OscStatus> =>
    ipcRenderer.invoke('get-osc-status'),
  startListening: (): Promise<void> =>
    ipcRenderer.invoke('start-listening'),
  startListeningAll: (): Promise<void> =>
    ipcRenderer.invoke('start-listening-all'),
  stopListening: (): Promise<void> =>
    ipcRenderer.invoke('stop-listening'),
  onListenAnyMessage: (callback: (listenedMessage: string) => void) =>
    ipcRenderer.on('listen-any-message', (_, listenedMessage: string) => callback(listenedMessage)),
  onChangeOscStatus: (callback: (oscStatus: OscStatus) => void) =>
    ipcRenderer.on('change-osc-status', (_, oscStatus: OscStatus) => callback(oscStatus)),
} as const;

const menuApi = {
  getMenuList: (): Promise<Menu[]> =>
    ipcRenderer.invoke('get-menu-list'),
  addMenu: (menu: Menu): Promise<Menu> =>
    ipcRenderer.invoke('add-menu', menu),
  deleteMenu: (id: number): Promise<Menu> =>
    ipcRenderer.invoke('delete-menu', id),
  replaceMenu: (id: number, newMenu: Menu): Promise<Menu> =>
    ipcRenderer.invoke('replace-menu', id, newMenu),
} as const;

const settingApi = {
  getSetting: <K extends keyof Setting>(settingName: K): Promise<Setting[K]> =>
    ipcRenderer.invoke('get-setting', settingName),
  getAllSetting: (): Promise<Setting> =>
    ipcRenderer.invoke('get-all-setting'),
  setSetting: <K extends keyof Setting>(settingName: K, value: Setting[K]): Promise<void> =>
    ipcRenderer.invoke('set-setting', settingName, value),
  setAllSetting: (setting: Setting) =>
    ipcRenderer.send('set-all-setting', setting),
  resetSetting: () =>
    ipcRenderer.send('reset-setting'),
} as const;

const statsApi = {
  getStatsList: (): Promise<StatsWithMenus[]> =>
    ipcRenderer.invoke('get-stats-list'),
  getTotalStats: (): Promise<TotalStats | undefined> =>
    ipcRenderer.invoke('get-total-stats'),
  addStats: (defeatCount: number, menuIdWithMultiplierList: MenuIdWithMultiplier[]): Promise<Stats> =>
    ipcRenderer.invoke('add-stats', defeatCount, menuIdWithMultiplierList),
  deleteStats: (id: number): Promise<Stats> =>
    ipcRenderer.invoke('delete-stats', id),
} as const;

const presetApi = {
  getPresetList: (): Promise<PresetWithMenus[]> =>
    ipcRenderer.invoke('get-preset-list'),
  addPreset: (name: string, presetMenuList: MenuIdWithMultiplier[]): Promise<Preset> =>
    ipcRenderer.invoke('add-preset', name, presetMenuList),
  updatePreset: (preset: Preset, menuIdWithMultiplierList: MenuIdWithMultiplier[]): Promise<UpdatePreset> =>
    ipcRenderer.invoke('update-preset', preset, menuIdWithMultiplierList),
  deletePreset: (id: number): Promise<Preset> =>
    ipcRenderer.invoke('delete-preset', id),
} as const;

const noticeApi = {
  onCreateNotice: (callback: (notice: Notice) => void) =>
    ipcRenderer.on('create-notice', (_, notice: Notice) => callback(notice)),
} as const;

const fileApi = {
  getLicenses: (): Promise<License[]> =>
    ipcRenderer.invoke('get-license-text'),
  openLicenseFolder: () =>
    ipcRenderer.send('open-license-folder'),
} as const;

const updateApi = {
  isUpdateAvailable: (): Promise<boolean> =>
    ipcRenderer.invoke('is-update-available'),
  downloadUpdate: (): Promise<void> =>
    ipcRenderer.invoke('download-update'),
  relaunchApp: () =>
    ipcRenderer.send('relaunch-app'),
  onReceiveDownloadProgress: (callback: (percent: number) => void) =>
    ipcRenderer.on('send-download-progress', (_, percent: number) => callback(percent)),
  onUpdateDownloaded: (callback: () => void) =>
    ipcRenderer.on('update-downloaded', () => callback()),
  onErrorWhileUpdate: (callback: (error: Error) => void) =>
    ipcRenderer.on('error-while-update', (_, error: Error) => callback(error)),
} as const;

contextBridge.exposeInMainWorld('defeatCount', defeatCountApi);
contextBridge.exposeInMainWorld('osc', oscApi);
contextBridge.exposeInMainWorld('menu', menuApi);
contextBridge.exposeInMainWorld('setting', settingApi);
contextBridge.exposeInMainWorld('stats', statsApi);
contextBridge.exposeInMainWorld('preset', presetApi);
contextBridge.exposeInMainWorld('notice', noticeApi);
contextBridge.exposeInMainWorld('file', fileApi);
contextBridge.exposeInMainWorld('update', updateApi);

export type DefeatCountApi = typeof defeatCountApi;
export type OscApi = typeof oscApi;
export type MenuApi = typeof menuApi;
export type SettingApi = typeof settingApi;
export type StatsApi = typeof statsApi;
export type PresetApi = typeof presetApi;
export type NoticeApi = typeof noticeApi;
export type FileApi = typeof fileApi;
export type UpdateApi = typeof updateApi;
