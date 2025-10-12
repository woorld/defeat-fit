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
};

export type StatsMenu = Omit<Menu, 'multiplier'> & {
  count: number,
};

export type Stats = {
  date: string, // YYYY-MM-DD
  defeatCount: number,
  menuList: StatsMenu[],
};

export type StatsMap = Map<string, Stats>; // stringはYYYY-MM-DD
