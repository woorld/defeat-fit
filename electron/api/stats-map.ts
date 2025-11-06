// TODO: Mapから配列になるのでファイル名を変える
import { PrismaClient } from '../../prisma/generated/client';
import type { Menu } from '../../prisma/generated/client';
import type { TotalStats } from '../../common/types';

const prisma = new PrismaClient();

export const statsMapApi = {
  getStatsMap() {
    return prisma.stats.findMany({
      include: {
        statsMenuList: {
          include: {
            menu: true
          },
        },
      },
    });
  },

  async getTotalStats(): Promise<TotalStats | undefined> {
    const getTotalDefeatCount = () => prisma.stats.aggregate({
      _sum: { defeatCount: true },
    });
    const getTotalMenuCountList = () => prisma.statsMenu.groupBy({
      by: [ 'menuId' ],
      _sum: { count: true },
    });

    const result = await Promise.all([
      getTotalDefeatCount(),
      getTotalMenuCountList(),
    ]);

    const totalDefeatCount = result[0];
    const totalMenuCountList = result[1];

    const relatedMenuList = await prisma.menu.findMany({
      where: { id: { in: totalMenuCountList.map(stats => stats.menuId) } },
    });

    const totalStats = {
      defeatCount: totalDefeatCount._sum.defeatCount ?? 0,
      statsMenuList: totalMenuCountList.map(stats => ({
        count: stats._sum.count ?? 0,
        menu: relatedMenuList.find(menu => menu.id === stats.menuId),
      })),
    }

    return totalStats;
  },

  async addStats(defeatCount: number, menuList: Menu[]) {
    // 次の日の朝5時までを本日とする
    // TODO: いつまでが今日なのかを設定で変えられるようにする
    const nowDate = new Date();
    nowDate.setHours(nowDate.getHours() - 5);
    // YYYY-MM-DD（sv-SE=スウェーデンの標準形式）で日付を取得
    const roundedNowDateString = nowDate.toLocaleDateString('sv-SE');

    // 統計本体を追加・更新
    const todayStats = await prisma.stats.upsert({
      where: { date: roundedNowDateString },
      update: {
        defeatCount: { increment: defeatCount },
      },
      create: {
        date: roundedNowDateString,
        defeatCount,
      },
    });

    for (const menu of menuList) {
      const menuCount = Math.ceil(menu.multiplier * defeatCount);

      // 作成した統計に紐づく統計メニューを追加・更新
      await prisma.statsMenu.upsert({
        where: {
          statsId_menuId: {
            statsId: todayStats.id,
            menuId: menu.id,
          },
        },
        update: {
          count: { increment: menuCount },
        },
        create: {
          statsId: todayStats.id,
          menuId: menu.id,
          count: menuCount,
        },
      });
    }

    return todayStats;
  },
} as const;
