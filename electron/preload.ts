import { ipcRenderer, contextBridge } from 'electron';

// TODO: 型付け
const oscApi = {
  onUpdateDeathCount: (callback: (deathCount: number) => void) =>
    ipcRenderer.on('update-death-count', (_, deathCount: number) => callback(deathCount)),
  decrementDeathCount: () =>
    ipcRenderer.invoke('decrement-death-count'),
  getListeningStatus: () =>
    ipcRenderer.invoke('get-listening-status'),
  toggleListening: () =>
    ipcRenderer.invoke('toggle-listening'),
};

contextBridge.exposeInMainWorld('osc', oscApi);

export type oscApi = typeof oscApi;
