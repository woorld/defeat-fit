import Store from 'electron-store';
import type { Stats, StatsMenu } from '../../common/types';

const store = new Store<Stats[]>();
const storeKey = 'stats';

const setStats = async (stats: Stats[]) => store.set(storeKey, stats);

export const statsApi = {
  // TODO: 期間指定して取得できる関数の追加
  async getStats(): Promise<Stats[]> {
    return store.get(storeKey, []);
  },

  async addStats(defeatCount: number, menu: StatsMenu[]) {
    // YYYY-MM-DD（スウェーデンの標準形式）で日付を取得
    const nowDate = new Date().toLocaleDateString('sv-SE');
    const stats = await statsApi.getStats();
    const todayStatsIndex = stats.findIndex(statsItem => statsItem.date === nowDate);

    if (todayStatsIndex <= -1) {
      stats.push({
        date: nowDate,
        defeatCount,
        menu,
      });
      return setStats(stats);
    }

    // 本日分がすでにある場合は負け回数、筋トレ回数をマージして格納
    const todayStats = stats[todayStatsIndex];
    const mergedMenu = [ ...todayStats.menu ];

    // TODO: もっといい書き方がありそう
    for (const menuItem of menu) {
      const existingMenuItemIndex = mergedMenu.findIndex(mergedMenuItem => mergedMenuItem.id === menuItem.id);

      if (existingMenuItemIndex <= -1) {
        mergedMenu.push(menuItem);
        continue;
      }

      mergedMenu[existingMenuItemIndex].count = mergedMenu[existingMenuItemIndex].count + menuItem.count;
    }

    const newTodayStats = {
      date: nowDate,
      defeatCount: todayStats.defeatCount + defeatCount,
      menu: mergedMenu,
    };

    // もともとあった本日分の統計を置き換えて保存
    stats.splice(todayStatsIndex, 1, newTodayStats);
    return setStats(stats);
  },
} as const;
