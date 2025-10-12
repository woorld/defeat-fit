// TODO: API名に合わせてファイル名を変更
import Store from 'electron-store';
import type { Stats, StatsMenu, StatsMap } from '../../common/types';

const storeKey = 'stats-map';
const store = new Store<(string | Stats)[]>({ name: storeKey });

const setStatsMap = async (statsMap: StatsMap) => store.set(storeKey, Array.from(statsMap));

export const statsMapApi = {
  // TODO: 期間指定して取得できる関数の追加
  async getStatsMap(): Promise<StatsMap> {
    const statsMap = store.get(storeKey, []);
    return new Map(statsMap); // TODO: ファイルから取得した値のチェック入れなくて大丈夫？
  },

  async addStats(defeatCount: number, menuList: StatsMenu[]) {
    // 次の日の朝5時までを本日とする
    // TODO: いつまでが今日なのかを設定で変えられるようにする
    const nowDate = new Date();
    nowDate.setHours(nowDate.getHours() - 5);
    // YYYY-MM-DD（sv-SE=スウェーデンの標準形式）で日付を取得
    const roundedNowDateString = nowDate.toLocaleDateString('sv-SE');

    const statsMap = await statsMapApi.getStatsMap();
    const todayStats = statsMap.get(roundedNowDateString);

    if (todayStats == undefined) {
      statsMap.set(roundedNowDateString, {
        date: roundedNowDateString,
        defeatCount,
        menuList,
      });
      return setStatsMap(statsMap);
    }

    // 本日分がすでにある場合は負け回数、筋トレ回数をマージして格納
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
    statsMap.set(roundedNowDateString, newTodayStats);
    return setStatsMap(statsMap);
  },
} as const;
