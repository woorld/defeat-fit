import { ipcRenderer, contextBridge } from 'electron';
import type { MenuIdWithMultiplier, PresetWithMenus, Setting, StatsWithMenus, TotalStats } from '../common/types';
import type { Menu, Stats, Preset } from '../prisma/generated/client';
import type { UpdatePreset } from './api/preset';

const defeatCountApi = {
  onUpdateDefeatCount: (callback: (defeatCount: number) => void) =>
    ipcRenderer.on('update-defeat-count', (_, defeatCount: number) => callback(defeatCount)),
  getDefeatCount: () =>
    ipcRenderer.invoke('get-defeat-count'),
  decrementDefeatCount: () =>
    ipcRenderer.invoke('decrement-defeat-count'),
  resetDefeatCount: () =>
    ipcRenderer.send('reset-defeat-count'),
} as const;

const oscApi = {
  getListeningStatus: () =>
    ipcRenderer.invoke('get-listening-status'),
  startListening: () =>
    ipcRenderer.invoke('start-listening'),
  stopListening: () =>
    ipcRenderer.invoke('stop-listening'),
} as const;

const menuListApi = {
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
  getSetting: (settingName: keyof Setting) =>
    ipcRenderer.invoke('get-setting', settingName),
  getAllSetting: () =>
    ipcRenderer.invoke('get-all-setting'),
  setSetting: <K extends keyof Setting>(settingName: K, value: Setting[K]) =>
    ipcRenderer.invoke('set-setting', settingName, value),
  setAllSetting: (setting: Setting) =>
    ipcRenderer.send('set-all-setting', setting),
  resetSetting: () =>
    ipcRenderer.send('reset-setting'),
} as const;

const statsListApi = {
  getStatsList: (): Promise<StatsWithMenus[]> =>
    ipcRenderer.invoke('get-stats-list'),
  getTotalStats: (): Promise<TotalStats | undefined> =>
    ipcRenderer.invoke('get-total-stats'),
  addStats: (defeatCount: number, menuList: Menu[]): Promise<Stats> =>
    ipcRenderer.invoke('add-stats', defeatCount, menuList),
} as const;

const presetApi = {
  getPresetList: (): Promise<PresetWithMenus[]> =>
    ipcRenderer.invoke('get-preset-list'),
  addPreset: (name: string, presetMenuList: MenuIdWithMultiplier[]): Promise<Preset> =>
    ipcRenderer.invoke('add-preset', name, presetMenuList),
  updatePreset: (preset: Preset, menuIdWithMultiplierList: MenuIdWithMultiplier[]): UpdatePreset =>
    ipcRenderer.invoke('update-preset', preset, menuIdWithMultiplierList),
  deletePreset: (id: number): Promise<Preset> =>
    ipcRenderer.invoke('delete-preset', id),
} as const;

contextBridge.exposeInMainWorld('defeatCount', defeatCountApi);
contextBridge.exposeInMainWorld('osc', oscApi);
contextBridge.exposeInMainWorld('menuList', menuListApi);
contextBridge.exposeInMainWorld('setting', settingApi);
contextBridge.exposeInMainWorld('statsList', statsListApi);
contextBridge.exposeInMainWorld('preset', presetApi);

export type DefeatCountApi = typeof defeatCountApi;
export type OscApi = typeof oscApi;
export type MenuListApi = typeof menuListApi;
export type SettingApi = typeof settingApi;
export type StatsListApi = typeof statsListApi;
export type PresetApi = typeof presetApi;
