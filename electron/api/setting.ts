import Store from 'electron-store';
import type { Setting } from '../../common/types';
import { SETTING_DEFAULT_VALUE } from '../../common/constants';

const store = new Store<Setting>();

export const getSetting = async (settingName: keyof Setting) => {
  const setting = await getAllSetting();
  return setting[settingName];
};

export const getAllSetting = async () => store.get('setting', SETTING_DEFAULT_VALUE);

export const setAllSetting = async (setting: Setting) => store.set('setting', setting);

export const resetSetting = async () => await setAllSetting(SETTING_DEFAULT_VALUE);
