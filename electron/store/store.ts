import Store from 'electron-store';
import { Schema } from '@electron/store/schema';
import path from 'node:path';
import fs from 'node:fs';
import { app } from 'electron';
import { ELECTRON_STORE_DEFAULT_VALUE } from '@common/constants';

const userDataPath = app.getPath('userData');
const settingFileName = 'config';
const settingPath = path.join(userDataPath, `${settingFileName}.json`);
const storePathOption = {
  // NOTE: リネーム処理でパスが食い違うのを防ぐため、明示的に指定する
  cwd: userDataPath,
  name: settingFileName,
} as const;

const getNewStore = (): Store<Schema> => {
  return new Store({
    defaults: ELECTRON_STORE_DEFAULT_VALUE,
    ...storePathOption,
  });
};

const renameSettingFile = () => {
  const renamedSettingPath = path.join(userDataPath, `config_bak-${Date.now()}.json`);

  try {
    if (!fs.existsSync(settingPath)) {
      throw Error('リネーム対象のファイルが存在しません');
    }

    fs.renameSync(settingPath, renamedSettingPath);
  }
  catch (e) {
    console.error(e);
  }
};

export const regenerateSettingFile = (): Store<Schema> => {
  renameSettingFile();
  return getNewStore();
};

export const getStore = (): Store<Schema> | null => {
  if (!fs.existsSync(settingPath)) {
    return getNewStore();
  }

  try {
    return new Store<Schema>(storePathOption);
  }
  catch (e) {
    if (e instanceof SyntaxError) {
      try {
        // JSONのパースに失敗した場合、既存の設定ファイルをリネームして新しい設定ファイルを生成する
        return regenerateSettingFile();
      }
      catch (e) {
        return null;
      }
    }
    console.log(e);
    return null;
  }
};
