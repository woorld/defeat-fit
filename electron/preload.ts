import { ipcRenderer, contextBridge } from 'electron';
import type { Menu, Setting } from '../common/types';

// TODO: 型付け
// TODO: 用途別に分ける
// TODO: invoke, sendの使い分け見直し
const oscApi = {
  onUpdateDefeatCount: (callback: (defeatCount: number) => void) =>
    ipcRenderer.on('update-defeat-count', (_, defeatCount: number) => callback(defeatCount)),
  decrementDefeatCount: () =>
    ipcRenderer.invoke('decrement-defeat-count'),
  getDefeatCount: () =>
    ipcRenderer.invoke('get-defeat-count'),
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
  getSetting: (settingName: keyof Setting) =>
    ipcRenderer.invoke('get-setting', settingName),
  getAllSetting: () =>
    ipcRenderer.invoke('get-all-setting'),
  setAllSetting: (setting: Setting) =>
    ipcRenderer.send('set-all-setting', setting),
  resetSetting: () =>
    ipcRenderer.send('reset-setting'),
};

contextBridge.exposeInMainWorld('osc', oscApi);
contextBridge.exposeInMainWorld('menuList', menuListApi);
contextBridge.exposeInMainWorld('setting', settingApi);

export type OscApi = typeof oscApi;
export type MenuListApi = typeof menuListApi;
export type SettingApi = typeof settingApi;
