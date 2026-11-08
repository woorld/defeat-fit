import { PrismaClient } from '@prisma-generated-client';
import type { MenuIdWithManualCount, MenuIdWithMultiplier, TotalStats } from '@common/types';
import { settingApi } from '@electron/api/setting';
import { ipcMain } from 'electron';
import { noticeApi } from '@electron/api/notice';
import { calcMenuAmount, getStatsDateString } from '@common/util';

const prisma = new PrismaClient();

let isInitialized = false;

export const statsApi = {
  initialize() {
    if (isInitialized) {
      return;
    }

    ipcMain.handle('get-stats-list', () => this.getStatsList());
    ipcMain.handle('get-total-stats', () => this.getTotalStats());
    ipcMain.handle(
      'add-stats', (
        _,
        defeatCount: number,
        menuIdWithMultiplierList: MenuIdWithMultiplier[]
      ) => this.addStats(defeatCount, menuIdWithMultiplierList)
    );
    ipcMain.handle(
      'set-manual-stats', (
        _,
        date: string,
        menuIdWithManualCountList: MenuIdWithManualCount[]
      ) => this.setManualStats(date, menuIdWithManualCountList)
    );
    ipcMain.handle('delete-stats', (_, id: number) => this.deleteStats(id));

    isInitialized = true;
  },

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
      prisma.statsMenu.groupBy({ by: [ 'menuId' ], _sum: { count: true, manualCount: true } }),
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
        manualCount: stats._sum.manualCount ?? 0,
        menu: relatedMenuList.find(menu => menu.id === stats.menuId),
      })),
    }

    return totalStats;
  },

  async addStats(defeatCount: number, menuIdWithMultiplierList: MenuIdWithMultiplier[]) {
    const hourOffset = await settingApi.getSetting('dayBoundaryOffsetHours');
    const roundedNowDateString = getStatsDateString(new Date(), hourOffset);

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

    const menuList = await prisma.menu.findMany({
      where: { id: { in: menuIdWithMultiplierList.map(menu => menu.menuId) } },
    });

    // TODO: forでupsertを回さずにstatsMenu: create{}でワンライナー的にできる？
    for (const menuIdWithMultiplier of menuIdWithMultiplierList) {
      const maxValue = menuList.find(menu => menu.id === menuIdWithMultiplier.menuId)?.maxValue ?? 0;
      const menuCount = calcMenuAmount(menuIdWithMultiplier.multiplier, defeatCount, maxValue);

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

    noticeApi.createNotice({
      text: '統計を保存しました',
      color: 'success',
    });

    return todayStats;
  },

  async setManualStats(date: string, menuIdWithManualCountList: MenuIdWithManualCount[]) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new Error(`Invalid stats date: ${date}`);
    }

    const result = await prisma.$transaction(async (tx) => {
      const stats = await tx.stats.upsert({
        where: { date },
        update: {},
        create: {
          date,
          defeatCount: 0,
        },
      });

      for (const { menuId, manualCount } of menuIdWithManualCountList) {
        await tx.statsMenu.upsert({
          where: {
            statsId_menuId: {
              statsId: stats.id,
              menuId,
            },
          },
          update: { manualCount },
          create: {
            statsId: stats.id,
            menuId,
            count: 0,
            manualCount,
          },
        });
      }

      // 回数がすべて0になった統計メニュー・統計は空の記録として残さない
      await tx.statsMenu.deleteMany({
        where: { statsId: stats.id, count: 0, manualCount: 0 },
      });
      const remainingStatsMenuCount = await tx.statsMenu.count({ where: { statsId: stats.id } });
      if (stats.defeatCount <= 0 && remainingStatsMenuCount <= 0) {
        await tx.stats.delete({ where: { id: stats.id } });
      }

      return stats;
    });

    noticeApi.createNotice({
      text: '手動登録を保存しました',
      color: 'success',
    });

    return result;
  },

  async deleteStats(id: number) {
    const result = await prisma.$transaction([
      prisma.statsMenu.deleteMany({ where: { statsId: id } }),
      prisma.stats.delete({ where: { id } }),
    ]);

    noticeApi.createNotice({
      text: '統計を削除しました',
      color: 'success',
    });

    return result;
  },
} as const;
