import type { Setting } from './types';

export const SETTING_DEFAULT_VALUE: Setting = {
  targetOscMessage: '',
  soundVolume: 0.5,
  breakTimeSecBetweenSets: 60,
  showCautionDialog: true,
  dayBoundaryOffsetHours: 0,
  lastSelectedPresetId: null,
} as const;
