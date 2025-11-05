import type { StatsMenu } from './types';
import type { MenuUnit } from '../prisma/generated/client';

export const mergeStatsMenu = (menuListA: StatsMenu[], menuListB: StatsMenu[]) => {
  // オブジェクトごとコピー
  const mergedMenuList = menuListA.map(menu => ({ ...menu }));

  for (const menuB of menuListB) {
    const existingMenuIndex = mergedMenuList.findIndex(mergedMenu => mergedMenu.id === menuB.id);

    if (existingMenuIndex <= -1) {
      mergedMenuList.push({ ...menuB }); // 参照を追加しないようコピー
      continue;
    }
    mergedMenuList[existingMenuIndex].count = mergedMenuList[existingMenuIndex].count + menuB.count;
  }

  return mergedMenuList;
};

export const menuUnitMap: Record<MenuUnit, string> = {
  COUNT: '回',
  SECOND: '秒',
};
