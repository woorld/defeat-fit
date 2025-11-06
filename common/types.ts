// TODO: Prismaに移行して不要になった型の削除
import type { Prisma } from '../prisma/generated/client';

export type MenuUnit = '回' | '秒';

export type Menu = {
  id: number,
  name: string,
  multiplier: number,
  unit: MenuUnit,
};

export type Setting = {
  targetOscMessage: string,
  soundVolume: number,
  breakTimeSecBetweenSets: number,
  showCautionDialog: boolean,
};

export type StatsMenu = Omit<Menu, 'multiplier'> & {
  count: number,
};

export type Stats = {
  date?: string, // YYYY-MM-DD、任意なのは合計を算出する場合にdateが不要なため
  defeatCount: number,
  menuList: StatsMenu[],
};

export type StatsMap = Map<string, Stats>; // stringはYYYY-MM-DD

export type StatsWithMenus = Prisma.StatsGetPayload<{
  include: {
    statsMenuList: {
      include: {
        menu: true,
      },
    },
  },
}>;
