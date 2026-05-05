import type { Setting } from '@common/types';
import type { Schema } from '@electron/store/schema';

export const SETTING_DEFAULT_VALUE: Setting = {
  targetOscMessage: [],
  soundVolume: 0.5,
  breakTimeSecBetweenSets: 60,
  showCautionDialog: true,
  dayBoundaryOffsetHours: 0,
  colorTheme: 'system',
  oscReceivedSound: 'slash',
} as const;

export const ELECTRON_STORE_DEFAULT_VALUE: Schema = {
  SCHEMA_VERSION: 3, // NOTE: number型のためバージョンと他の値が食い違っていても型エラーにならないため注意
  setting: SETTING_DEFAULT_VALUE,
  lastSelectedPresetId: null,
} as const;

export const ALLOWED_EXTERNAL_LINKS: { [key: string]: string} = {
  githubRepository: 'https://github.com/woorld/defeat-fit',
  developerTwitter: 'https://x.com/world912000',
} as const;
