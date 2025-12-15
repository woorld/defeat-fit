import { ipcMain } from "electron";

let defeatCount = 0;
let isInitialized = false;

export const defeatCountApi = {
  initialize(deps: { sendMessage: (channel: string, ...args: any[]) => void }) {
    if (isInitialized) {
      return;
    }

    ipcMain.handle('get-defeat-count', this.getDefeatCount);
    ipcMain.handle('decrement-defeat-count', this.decrementDefeatCount);
    ipcMain.on('reset-defeat-count', () => {
      this.resetDefeatCount();
      deps.sendMessage('update-defeat-count', this.getDefeatCount());
    });

    isInitialized = true;
  },

  getDefeatCount() {
    return defeatCount;
  },

  incrementDefeatCount() {
    return ++defeatCount;
  },

  decrementDefeatCount() {
    return defeatCount >= 1 ? --defeatCount : defeatCount;
  },

  resetDefeatCount() {
    defeatCount = 0;
  },
} as const;
