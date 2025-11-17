import { PrismaClient } from '../../prisma/generated/client';
import type { MenuIdWithMultiplier, TotalStats } from '../../common/types';

const prisma = new PrismaClient();

export const statsApi = {
  getStatsList() {
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
    // 負け回数と各メニューの合計回数を並列で取得
    const result = await Promise.all([
      prisma.stats.aggregate({ _sum: { defeatCount: true } }),
      prisma.statsMenu.groupBy({ by: [ 'menuId' ], _sum: { count: true } }),
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

  async addStats(defeatCount: number, menuIdWithMultiplierList: MenuIdWithMultiplier[]) {
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

    // TODO: forでupsertを回さずにstatsMenu: create{}でワンライナー的にできる？
    for (const menuIdWithMultiplier of menuIdWithMultiplierList) {
      const menuCount = Math.ceil(menuIdWithMultiplier.multiplier * defeatCount);

      // 作成した統計に紐づく統計メニューを追加・更新
      await prisma.statsMenu.upsert({
        where: {
          statsId_menuId: {
            statsId: todayStats.id,
            menuId: menuIdWithMultiplier.menuId,
          },
        },
        update: {
          count: { increment: menuCount },
        },
        create: {
          statsId: todayStats.id,
          menuId: menuIdWithMultiplier.menuId,
          count: menuCount,
        },
      });
    }

    return todayStats;
  },

  async deleteStats(id: number) {
    await prisma.statsMenu.deleteMany({ where: { statsId: id } });
    return prisma.stats.delete({ where: { id } });
  },
} as const;
