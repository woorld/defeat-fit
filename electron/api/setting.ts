import Store from 'electron-store';

export type Setting = {
  targetOscMessage: string,
  soundVolume: number,
  breakTimeSecBetweenSets: number
};

const SETTING_DEFAULT_VALUE: Setting = {
  targetOscMessage: '',
  soundVolume: 0.5,
  breakTimeSecBetweenSets: 60,
} as const;

const store = new Store<Setting>();

const setAllSetting = (setting: Setting) => store.set('setting', setting);

export const getAllSetting = async (): Promise<Setting> => store.get('setting', SETTING_DEFAULT_VALUE);

export const setSetting = async <K extends keyof Setting>(settingName: K, value: Setting[K]) => {
  const setting = await getAllSetting();
  setting[settingName] = value;
  setAllSetting(setting);
};

export const resetSetting = () => setAllSetting(SETTING_DEFAULT_VALUE);
