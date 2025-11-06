import { ipcRenderer, contextBridge } from 'electron';
import type { Setting, StatsWithMenus, TotalStats } from '../common/types';
import type { Menu, Stats } from '../prisma/generated/client';

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

const statsMapApi = {
  getStatsMap: (): Promise<StatsWithMenus[]> =>
    ipcRenderer.invoke('get-stats-map'),
  getTotalStats: (): Promise<TotalStats | undefined> =>
    ipcRenderer.invoke('get-total-stats'),
  addStats: (defeatCount: number, menuList: Menu[]): Promise<Stats> =>
    ipcRenderer.invoke('add-stats', defeatCount, menuList),
} as const;

contextBridge.exposeInMainWorld('defeatCount', defeatCountApi);
contextBridge.exposeInMainWorld('osc', oscApi);
contextBridge.exposeInMainWorld('menuList', menuListApi);
contextBridge.exposeInMainWorld('setting', settingApi);
contextBridge.exposeInMainWorld('statsMap', statsMapApi);

export type DefeatCountApi = typeof defeatCountApi;
export type OscApi = typeof oscApi;
export type MenuListApi = typeof menuListApi;
export type SettingApi = typeof settingApi;
export type StatsMapApi = typeof statsMapApi;
