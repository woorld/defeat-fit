import Store from 'electron-store';
import type { SchemaV1 } from '@electron/store/schema';
import type { TargetOscMessageSetting } from '@common/types';
import { getStore, regenerateSettingFile } from '@electron/store/store';
import { SETTING_DEFAULT_VALUE } from '@common/constants';

export const migrateStore = () => {
  const store = getStore();
  if (store === null) {
    console.log('DefeatFit: 設定ファイルのマイグレーションに失敗しました');
    return;
  }

  const currentVersion = store.get('SCHEMA_VERSION', 1);

  if (typeof currentVersion !== 'number') {
    regenerateSettingFile();
    return;
  }

  try {
    if (currentVersion <= 1) {
      migrateV1ToV2(store as unknown as Store<SchemaV1>);
    }
  }
  catch (e) {
    console.error(e);
    regenerateSettingFile();
  }
};

const migrateV1ToV2 = (store: Store<SchemaV1>) => {
  const targetOscMessage = store.get('setting.targetOscMessage');

  if (typeof targetOscMessage !== 'string') {
    throw Error('設定のスキーマが不正です');
  }

  const targetOscMessageSetting: TargetOscMessageSetting[] = targetOscMessage === ''
    ? []
    : [{
      id: Date.now(),
      address: targetOscMessage,
      enabled: true,
    }];

  store.set('setting.targetOscMessage', targetOscMessageSetting);
  store.set('setting.oscReceivedSound', SETTING_DEFAULT_VALUE.oscReceivedSound);
  store.set('SCHEMA_VERSION', 2);
};
