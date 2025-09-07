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
  breakTimeSecBetweenSets: number
};
