import type { WebContents } from 'electron';
import type { Prisma, Menu, PresetMenu } from '../prisma/generated/client';

export type TargetOscMessageSetting = {
  id: number,
  address: string,
  enabled: boolean,
};

export type ColorThemeSetting = 'light' | 'dark' | 'system';

export type Setting = {
  targetOscMessage: TargetOscMessageSetting[],
  soundVolume: number,
  breakTimeSecBetweenSets: number,
  showCautionDialog: boolean,
  dayBoundaryOffsetHours: number,
  lastSelectedPresetId: number | null,
  colorTheme: ColorThemeSetting,
};

export type StatsWithMenus = Prisma.StatsGetPayload<{
  include: {
    statsMenuList: {
      include: {
        menu: true,
      },
    },
  },
}>;

export type TotalStats = {
  defeatCount: number,
  statsMenuList: {
    count: number,
    menu?: Menu,
  }[],
};

export type PresetWithMenus = Prisma.PresetGetPayload<{
  include: {
    presetMenuList: {
      include: {
        menu: true,
      },
    },
  },
}>;

export type MenuIdWithMultiplier = {
  menuId: Menu['id'],
  multiplier: PresetMenu['multiplier'],
};

export type OscStatus = 'OPEN'| 'OPEN_ALL' | 'CLOSE' | 'PENDING';

export type Notice = {
  text: string,
  color: 'success' | 'error' | 'warning' | 'info',
};

export type SendMessage = WebContents['send'];

export type License = {
  name: string | null,
  version: string | null,
  licenseText: string | null,
};
