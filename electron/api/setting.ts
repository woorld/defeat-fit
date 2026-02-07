import Store from 'electron-store';
import type { Setting, TargetOscMessageSetting } from '../../common/types';
import { SETTING_DEFAULT_VALUE } from '../../common/constants';
import { ipcMain, type IpcMainInvokeEvent } from 'electron';
import { oscApi } from './osc';
import { noticeApi } from './notice';

const store = new Store<{ setting: Setting }>();
const storeKey = 'setting';

let isInitialized = false;

const isTargetOscMessageSettingKey = (key: keyof Setting): key is 'targetOscMessage' =>
  key === 'targetOscMessage';

const formatTargetOscMessageSetting = (settings: TargetOscMessageSetting[]): TargetOscMessageSetting[] => {
  const validSettings: TargetOscMessageSetting[] = [];

  for (const setting of settings) {
    const existAddresses = validSettings.map(s => s.address);
    // 空文字列、重複するアドレスをはじく
    if (setting.address.trim() === '' || existAddresses.includes(setting.address)) {
      continue;
    }
    validSettings.push(setting);
  }

  return validSettings;
};

export const settingApi = {
  initialize() {
    if (isInitialized) {
      return;
    }

    ipcMain.handle('get-setting', (_, settingName: keyof Setting) => this.getSetting(settingName));
    ipcMain.handle('get-all-setting', () => this.getAllSetting());
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
      if (oscApi.getOscStatus() === 'OPEN') {
        // OSCサーバを開きなおさないと変更が反映されない
        await oscApi.closeServer();
        return oscApi.openServer();
      }
    });
    ipcMain.on('reset-setting', () => this.resetSetting());

    isInitialized = true;
  },

  async getSetting<K extends keyof Setting>(settingName: K): Promise<Setting[K]> {
    const setting = await this.getAllSetting();
    return setting[settingName] ?? SETTING_DEFAULT_VALUE[settingName];
  },

  async getAllSetting(): Promise<Setting> {
    return store.get(storeKey, SETTING_DEFAULT_VALUE);
  },

  async setSetting<K extends keyof Setting>(settingName: K, value: Setting[K]) {
    const setting = await this.getAllSetting();

    // NOTE: setting[settingName] = isTargetOscMessageSettingKey(settingName) ? ... : ... は無理
    isTargetOscMessageSettingKey(settingName)
      // NOTE: Setting['targetOscMessage']: TargetOscMessageSetting[] なので型アサーションして問題ない
      ? setting[settingName] = formatTargetOscMessageSetting(value as TargetOscMessageSetting[])
      : setting[settingName] = value;

    return this.setAllSetting(setting);
  },

  async setAllSetting(setting: Setting) {
    setting.targetOscMessage = formatTargetOscMessageSetting(setting.targetOscMessage);
    await store.set(storeKey, setting);
    noticeApi.createNotice({
      text: '設定を保存しました',
      color: 'success',
    });
  },

  async resetSetting() {
    await oscApi.closeServer(); // 対象OSCメッセージが空文字列になるためオフにする
    await this.setAllSetting(SETTING_DEFAULT_VALUE);

    noticeApi.createNotice({
      text: '設定をリセットしました',
      color: 'success',
    });
  },
} as const;
