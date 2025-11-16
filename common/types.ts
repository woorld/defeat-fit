import type { Prisma, Menu, PresetMenu } from '../prisma/generated/client';

export type Setting = {
  targetOscMessage: string,
  soundVolume: number,
  breakTimeSecBetweenSets: number,
  showCautionDialog: boolean,
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
