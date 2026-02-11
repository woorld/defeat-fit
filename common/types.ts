import type { WebContents } from 'electron';
import type { Prisma, Menu, PresetMenu } from '../prisma/generated/client';
import type { Schema } from '../electron/store/schema';

export type Setting = Schema['setting'];

export type TargetOscMessageSetting = Setting['targetOscMessage'][number];

export type ColorThemeSetting = Setting['colorTheme'];

export type DefeatSoundSetting = Setting['defeatSound'];

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
