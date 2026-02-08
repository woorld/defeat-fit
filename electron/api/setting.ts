import Store from 'electron-store';
import type { Setting, TargetOscMessageSetting } from '../../common/types';
import { SETTING_DEFAULT_VALUE } from '../../common/constants';
import { app, ipcMain, type IpcMainInvokeEvent } from 'electron';
import { noticeApi } from './notice';
import path from 'node:path';
import fs from 'node:fs';
import type { Schema } from '../../common/electron-store-schema';

let store: Store<Schema> | null = null;
const storeKey = 'setting';
let isInitialized = false;

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

const regenerateSettingFile = () => {
  const userDataPath = app.getPath('userData');
  const settingPath = path.join(userDataPath, 'config.json');
  const renamedSettingPath = path.join(userDataPath, `config_bak-${Date.now()}.json`);

  // JSONのパースに失敗した場合、既存の設定ファイルをリネームして新しい設定ファイルを生成する
  try {
    if (!fs.existsSync(settingPath)) {
      throw Error('リネーム対象のファイルが存在しません');
    }

    fs.renameSync(settingPath, renamedSettingPath);

    noticeApi.createNotice({
      text: '破損した設定ファイルをバックアップし、設定ファイルを再作成しました',
      color: 'success',
    });
  }
  catch (e) {
    console.error(e);
    store = null;
    noticeApi.createNotice({
      text: '既存の設定ファイルのバックアップ・再作成処理に失敗しました',
      color: 'error',
    });
  }
};

const getStore = (): Store<Schema> | null => {
  try {
    return new Store<Schema>();
  }
  catch (e) {
    if (e instanceof SyntaxError) {
      regenerateSettingFile();
      return new Store<Schema>();
    }
    console.log(e);
    return null;
  }
};

export const settingApi = {
  initialize() {
    if (isInitialized) {
      return;
    }

    store = getStore();

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
    ipcMain.on('set-all-setting', (_, setting: Setting) => this.setAllSetting(setting));
    ipcMain.on('reset-setting', () => this.resetSetting());

    isInitialized = true;
  },

  getSetting<K extends keyof Setting>(settingName: K): Setting[K] {
    const setting = this.getAllSetting();
    return setting[settingName] ?? SETTING_DEFAULT_VALUE[settingName];
  },

  getAllSetting(): Setting {
    if (store === null) {
      store = getStore();
      if (store === null) {
        noticeApi.createNotice({
          text: '設定の読み込みに失敗しました',
          color: 'error',
        });
        return SETTING_DEFAULT_VALUE;
      }
    }

    try {
      return store.get(storeKey, SETTING_DEFAULT_VALUE);
    }
    catch (e) {
      store = getStore();

      if (store === null) {
        noticeApi.createNotice({
          text: '設定の読み込みに失敗しました',
          color: 'error',
        });
        return SETTING_DEFAULT_VALUE;
      }

      return store.get(storeKey, SETTING_DEFAULT_VALUE);
    }
  },

  setSetting<K extends keyof Setting>(settingName: K, value: Setting[K]) {
    const setting = this.getAllSetting();

    // NOTE: setting[settingName] = isTargetOscMessageSettingKey(settingName) ? ... : ... は無理
    settingName === 'targetOscMessage'
      // NOTE: setting[settingName] だと型エラー、value: Setting['targetOscMessage'] なので型アサーションしてOK
      ? setting.targetOscMessage = formatTargetOscMessageSetting(value as TargetOscMessageSetting[])
      : setting[settingName] = value;

    return this.setAllSetting(setting);
  },

  setAllSetting(setting: Setting) {
    if (store === null) {
      store = getStore();
      if (store === null) {
        noticeApi.createNotice({
          text: '設定の保存に失敗しました',
          color: 'error',
        });
        return;
      }
    }

    setting.targetOscMessage = formatTargetOscMessageSetting(setting.targetOscMessage);

    try {
      store.set(storeKey, setting);
    }
    catch (e) {
      store = getStore();

      if (store === null) {
        noticeApi.createNotice({
          text: '設定の保存に失敗しました',
          color: 'error',
        });
        return;
      }

      store.set(storeKey, setting);
    }

    noticeApi.createNotice({
      text: '設定を保存しました',
      color: 'success',
    });
  },

  resetSetting() {
    this.setAllSetting(SETTING_DEFAULT_VALUE);

    noticeApi.createNotice({
      text: '設定をリセットしました',
      color: 'success',
    });
  },
} as const;
