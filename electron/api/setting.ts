import Store from 'electron-store';
import type { Setting } from '../../common/types';
import { SETTING_DEFAULT_VALUE } from '../../common/constants';

const store = new Store<Setting>();

const setAllSetting = (setting: Setting) => store.set('setting', setting);

export const getAllSetting = async (): Promise<Setting> => store.get('setting', SETTING_DEFAULT_VALUE);

export const setSetting = async <K extends keyof Setting>(settingName: K, value: Setting[K]) => {
  const setting = await getAllSetting();
  setting[settingName] = value;
  setAllSetting(setting);
};

export const resetSetting = async () => await setAllSetting(SETTING_DEFAULT_VALUE);
