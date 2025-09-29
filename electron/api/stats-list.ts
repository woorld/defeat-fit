// TODO: StatsをMapで管理すると絞り込みとかが楽かも
/*
 * 例
 * // let arr: { id: string }[]
 * const byId = new Map<string, { id: string }>(arr.map(e => [e.id, e]));
 */
import Store from 'electron-store';
import type { Stats, StatsMenu } from '../../common/types';

const store = new Store<Stats[]>({ name: 'stats-list' });
const storeKey = 'statsList';

const setStatsList = async (statsList: Stats[]) => store.set(storeKey, statsList);

export const statsListApi = {
  // TODO: 期間指定して取得できる関数の追加
  async getStatsList(): Promise<Stats[]> {
    return store.get(storeKey, []);
  },

  async addStats(defeatCount: number, menuList: StatsMenu[]) {
    // 次の日の朝5時までを本日とする
    // TODO: いつまでが今日なのかを設定で変えられるようにする
    const nowDate = new Date();
    nowDate.setHours(nowDate.getHours() - 5);
    // YYYY-MM-DD（sv-SE=スウェーデンの標準形式）で日付を取得
    const roundedNowDateString = nowDate.toLocaleDateString('sv-SE');

    const statsList = await statsListApi.getStatsList();
    const todayStatsIndex = statsList.findIndex(stats => stats.date === roundedNowDateString);

    if (todayStatsIndex <= -1) {
      statsList.push({
        date: roundedNowDateString,
        defeatCount,
        menuList,
      });
      return setStatsList(statsList);
    }

    // 本日分がすでにある場合は負け回数、筋トレ回数をマージして格納
    const todayStats = statsList[todayStatsIndex];
    const mergedMenu = [ ...todayStats.menuList ];

    // TODO: もっといい書き方がありそう
    for (const menu of menuList) {
      const existingMenuIndex = mergedMenu.findIndex(mergedMenu => mergedMenu.id === menu.id);

      if (existingMenuIndex <= -1) {
        mergedMenu.push(menu);
        continue;
      }

      mergedMenu[existingMenuIndex].count = mergedMenu[existingMenuIndex].count + menu.count;
    }

    const newTodayStats = {
      date: roundedNowDateString,
      defeatCount: todayStats.defeatCount + defeatCount,
      menuList: mergedMenu,
    };

    // もともとあった本日分の統計を置き換えて保存
    statsList.splice(todayStatsIndex, 1, newTodayStats);
    return setStatsList(statsList);
  },
} as const;
