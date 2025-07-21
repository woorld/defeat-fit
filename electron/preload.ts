import { ipcRenderer, contextBridge } from 'electron';

export const oscApi = {
  onUpdateDeathCount: (callback: Function) => ipcRenderer.on('update-death-count', (_, deathCount: number) => callback(deathCount)),
};

contextBridge.exposeInMainWorld('osc', oscApi);
