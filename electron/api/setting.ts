import Store from 'electron-store';
import type { Setting } from '../../common/types';
import { SETTING_DEFAULT_VALUE } from '../../common/constants';

const store = new Store<Setting>();

export const settingApi = {
  getSetting: async <K extends keyof Setting>(settingName: K): Promise<Setting[K]> => {
    const setting = await settingApi.getAllSetting();
    return setting[settingName];
  },

  getAllSetting: async () => store.get('setting', SETTING_DEFAULT_VALUE),

  setAllSetting: async (setting: Setting) => store.set('setting', setting),

  resetSetting: async () => await settingApi.setAllSetting(SETTING_DEFAULT_VALUE),
} as const;
