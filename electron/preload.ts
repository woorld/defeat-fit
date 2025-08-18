import { ipcRenderer, contextBridge } from 'electron';

const oscApi = {
  onUpdateDeathCount: (callback: (deathCount: number) => void) =>
    ipcRenderer.on('update-death-count', (_, deathCount: number) => callback(deathCount)),
  decrementDeathCount: () =>
    ipcRenderer.invoke('decrement-death-count'),
};

contextBridge.exposeInMainWorld('osc', oscApi);

export type oscApi = typeof oscApi;
