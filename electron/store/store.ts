import Store from 'electron-store';
import { Schema } from './schema';
import path from 'node:path';
import fs from 'node:fs';
import { app } from 'electron';
import { ELECTRON_STORE_DEFAULT_VALUE } from '../../common/constants';

const userDataPath = app.getPath('userData');
const settingPath = path.join(userDataPath, 'config.json');

const getNewStore = () => {
  return new Store({ defaults: ELECTRON_STORE_DEFAULT_VALUE });
};

export const renameInvalidSettingFile = () => {
  const renamedSettingPath = path.join(userDataPath, `config_bak-${Date.now()}.json`);

  // JSONのパースに失敗した場合、既存の設定ファイルをリネームして新しい設定ファイルを生成する
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

export const getStore = (): Store<Schema> | null => {
  if (!fs.existsSync(settingPath)) {
    return getNewStore();
  }

  try {
    return new Store<Schema>();
  }
  catch (e) {
    if (e instanceof SyntaxError) {
      try {
        renameInvalidSettingFile();
        return getNewStore();
      }
      catch (e) {
        return null;
      }
    }
    console.log(e);
    return null;
  }
};
