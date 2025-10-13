import { ipcRenderer, contextBridge } from 'electron';
import type { Menu, Setting, StatsMenu } from '../common/types';

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
  getMenuList: () =>
    ipcRenderer.invoke('get-menu-list'),
  addMenu: (menu: Menu) =>
    ipcRenderer.send('add-menu', menu),
  deleteMenu: (id: number) =>
    ipcRenderer.send('delete-menu', id),
  replaceMenu: (id: number, newMenu: Menu) =>
    ipcRenderer.send('replace-menu', id, newMenu),
} as const;

const settingApi = {
  getSetting: (settingName: keyof Setting) =>
    ipcRenderer.invoke('get-setting', settingName),
  getAllSetting: () =>
    ipcRenderer.invoke('get-all-setting'),
  setAllSetting: (setting: Setting) =>
    ipcRenderer.send('set-all-setting', setting),
  resetSetting: () =>
    ipcRenderer.send('reset-setting'),
} as const;

const statsMapApi = {
  getStatsMap: () =>
    ipcRenderer.invoke('get-stats-map'),
  addStats: (defeatCount: number, menu: StatsMenu[]) =>
    ipcRenderer.invoke('add-stats', defeatCount, menu),
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
