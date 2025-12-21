import type { Setting } from './types';

export const SETTING_DEFAULT_VALUE: Setting = {
  targetOscMessage: '',
  soundVolume: 0.5,
  breakTimeSecBetweenSets: 60,
  showCautionDialog: true,
  dayBoundaryOffsetHours: 0,
  lastSelectedPresetId: null,
} as const;

export const ALLOWED_EXTERNAL_LINKS: { [key: string]: string } = {
  githubRepository: 'https://github.com/woorld/defeat-fit',
  developerTwitter: 'https://x.com/world912000',
} as const;
