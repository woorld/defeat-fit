import Store from 'electron-store';
import type { SchemaV1, SchemaV2 } from '@electron/store/schema';
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
    if (currentVersion <= 2) {
      migrateV2ToV3(store as unknown as Store<SchemaV2>);
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

const migrateV2ToV3 = (store: Store<SchemaV2>) => {
  const lastSelectedPresetId = store.get('setting.lastSelectedPresetId');

  if (lastSelectedPresetId !== null && typeof lastSelectedPresetId !== 'number') {
    throw Error('設定のスキーマが不正です');
  }

  store.set('lastSelectedPresetId', lastSelectedPresetId);
  store.delete('setting.lastSelectedPresetId');
  store.set('setting.autoCountThresholdRange', SETTING_DEFAULT_VALUE.autoCountThresholdRange);
  store.set('SCHEMA_VERSION', 3);
};
