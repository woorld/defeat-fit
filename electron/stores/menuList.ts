import Store from 'electron-store';

export type Menu = {
  name: string,
  multiplier: number,
  unit: '回' | '秒',
}

const store = new Store<Menu[]>();

export const getMenuList = (): Promise<Menu[]> => store.get('menuList');
export const setMenuList = (menuList: Menu[]) => store.set('menuList', menuList);
