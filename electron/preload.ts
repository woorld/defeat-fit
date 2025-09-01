import { ipcRenderer, contextBridge } from 'electron';
import type { Menu } from './stores/menuList';

// TODO: 型付け
// TODO: 用途別に分ける
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
  getMenuList: () =>
    ipcRenderer.invoke('get-menu-list'),
  setMenuList: (menuList: Menu[]) =>
    ipcRenderer.invoke('set-menu-list', menuList),
};

contextBridge.exposeInMainWorld('osc', oscApi);

export type oscApi = typeof oscApi;
