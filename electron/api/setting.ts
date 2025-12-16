import Store from 'electron-store';
import type { Setting } from '../../common/types';
import { SETTING_DEFAULT_VALUE } from '../../common/constants';
import { ipcMain, type IpcMainInvokeEvent } from 'electron';

const store = new Store<Setting>();
const storeKey = 'setting';

let isInitialized = false;

export const settingApi = {
  initialize(deps: { reopenOscServer: () => Promise<void> }) {
    if (isInitialized) {
      return;
    }

    ipcMain.handle('get-setting', (_, settingName: keyof Setting) => this.getSetting(settingName));
    ipcMain.handle('get-all-setting', this.getAllSetting);
    ipcMain.handle(
      'set-setting',
      <K extends keyof Setting>(
        _: IpcMainInvokeEvent,
        settingName: K,
        value: Setting[K]
      ) => this.setSetting(settingName, value)
    );
    ipcMain.on('set-all-setting', async (_, setting: Setting) => {
      this.setAllSetting(setting);
      deps.reopenOscServer();
    });
    ipcMain.on('reset-setting', this.resetSetting);

    isInitialized = true;
  },

  async getSetting<K extends keyof Setting>(settingName: K): Promise<Setting[K]> {
    const setting = await settingApi.getAllSetting();
    return setting[settingName] ?? SETTING_DEFAULT_VALUE[settingName];
  },

  async getAllSetting() {
    return store.get(storeKey, SETTING_DEFAULT_VALUE);
  },

  async setSetting<K extends keyof Setting>(settingName: K, value: Setting[K]) {
    const setting = await settingApi.getAllSetting();
    setting[settingName] = value;
    return settingApi.setAllSetting(setting);
  },

  async setAllSetting(setting: Setting) {
    return store.set(storeKey, setting);
  },

  async resetSetting() {
    return settingApi.setAllSetting(SETTING_DEFAULT_VALUE);
  },
} as const;
