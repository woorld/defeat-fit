// TODO: Mapから配列になるのでファイル名を変える
import { PrismaClient } from '../../prisma/generated/client';
import type { Menu } from '../../prisma/generated/client';

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
