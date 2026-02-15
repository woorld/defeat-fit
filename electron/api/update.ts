import { app, ipcMain } from 'electron';
import type { SendMessage } from '@common/types';
import electronUpdater, { type AppUpdater } from 'electron-updater';
import { oscApi } from '@electron/api/osc';

// NOTE: https://www.electron.build/auto-update#quick-setup-guide に沿った実装
const getAutoUpdater = (): AppUpdater => {
  const { autoUpdater } = electronUpdater;

  if (!app.isPackaged) {
    autoUpdater.forceDevUpdateConfig = true;
  }
  autoUpdater.autoDownload = false;

  autoUpdater.on('download-progress', (progressInfo) => {
    sendMessageIfNotNull('send-download-progress', progressInfo.percent);
  });
  autoUpdater.on('update-downloaded', () => {
    sendMessageIfNotNull('update-downloaded');
  });
  autoUpdater.on('error', (error) => {
    sendMessageIfNotNull('error-while-update', error);
  });

  return autoUpdater;
};

const autoUpdater = getAutoUpdater();
let isInitialized = false;
let sendMessage: SendMessage | null = null;

const sendMessageIfNotNull: SendMessage = (channel, ...args) => {
  if (sendMessage !== null) {
    sendMessage(channel, ...args);
  }
};

export const updateApi = {
  initialize(deps: { sendMessage: SendMessage }) {
    if (isInitialized) {
      return;
    }

    sendMessage = deps.sendMessage;

    ipcMain.handle('is-update-available', () => this.isUpdateAvailable());
    ipcMain.handle('download-update', () => this.downloadUpdate());
    ipcMain.on('relaunch-app', () => this.relaunchApp());

    isInitialized = true;
  },

  async isUpdateAvailable() {
    const result = await autoUpdater.checkForUpdates();
    return Boolean(result?.isUpdateAvailable);
  },

  async downloadUpdate() {
    autoUpdater.downloadUpdate();
  },

  relaunchApp() {
    oscApi.stopDiscovery();
    oscApi.closeServer();
    autoUpdater.quitAndInstall(true, true);
  },
} as const;
