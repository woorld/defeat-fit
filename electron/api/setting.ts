import Store from 'electron-store';
import type { Setting } from '../../common/types';
import { SETTING_DEFAULT_VALUE } from '../../common/constants';

const store = new Store<Setting>();
const storeKey = 'setting';

export const settingApi = {
  async getSetting<K extends keyof Setting>(settingName: K): Promise<Setting[K]> {
    // TODO: 設定の値がなかった場合にデフォルト値を返すようにする
    const setting = await settingApi.getAllSetting();
    return setting[settingName];
  },

  async getAllSetting() {
    return store.get(storeKey, SETTING_DEFAULT_VALUE);
  },

  async setSetting<K extends keyof Setting>(settingName: K, value: Setting[K]) {
    const setting = await settingApi.getAllSetting();
    setting[settingName] = value;
    console.log(setting);
    return settingApi.setAllSetting(setting);
  },

  async setAllSetting(setting: Setting) {
    return store.set(storeKey, setting);
  },

  async resetSetting() {
    return settingApi.setAllSetting(SETTING_DEFAULT_VALUE);
  },
} as const;
