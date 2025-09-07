import { ipcRenderer, contextBridge } from 'electron';
import type { Menu } from './api/menu-list';
import type { Setting } from '../common/types';

// TODO: 型付け
// TODO: 用途別に分ける
// TODO: invoke, sendの使い分け見直し
const oscApi = {
  onUpdateDeathCount: (callback: (deathCount: number) => void) =>
    ipcRenderer.on('update-death-count', (_, deathCount: number) => callback(deathCount)),
  decrementDeathCount: () =>
    ipcRenderer.invoke('decrement-death-count'),
  getDeathCount: () =>
    ipcRenderer.invoke('get-death-count'),
  getListeningStatus: () =>
    ipcRenderer.invoke('get-listening-status'),
  toggleListening: () =>
    ipcRenderer.invoke('toggle-listening'),
};

const menuListApi = {
  getMenuList: () =>
    ipcRenderer.invoke('get-menu-list'),
  addMenu: (menu: Menu) =>
    ipcRenderer.send('add-menu', menu),
  deleteMenu: (id: number) =>
    ipcRenderer.send('delete-menu', id),
  replaceMenu: (id: number, newMenu: Menu) =>
    ipcRenderer.send('replace-menu', id, newMenu),
};

const settingApi = {
  getAllSetting: () =>
    ipcRenderer.invoke('get-all-setting'),
  setSetting: <K extends keyof Setting>(settingName: K, value: Setting[K]) =>
    ipcRenderer.send('set-setting', settingName, value),
  resetSetting: () =>
    ipcRenderer.send('reset-setting'),
};

contextBridge.exposeInMainWorld('osc', oscApi);
contextBridge.exposeInMainWorld('menuList', menuListApi);
contextBridge.exposeInMainWorld('setting', settingApi);

export type OscApi = typeof oscApi;
export type MenuListApi = typeof menuListApi;
export type SettingApi = typeof settingApi;
