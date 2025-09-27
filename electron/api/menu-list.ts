import Store from 'electron-store';
import type { Menu } from '../../common/types';

const store = new Store<Menu[]>();
const storeKey = 'menuList';

const setMenuList = (menuList: Menu[]) => store.set(storeKey, menuList);

export const menuListApi = {
  async getMenuList(): Promise<Menu[]> {
    return store.get(storeKey, []);
  },

  async addMenu(menu: Menu) {
    const menuList = await menuListApi.getMenuList();
    setMenuList([ ...menuList, menu ]);
  },

  async deleteMenu(id: number) {
    const menuList = await menuListApi.getMenuList();
    setMenuList(menuList.filter(menu => menu.id !== id));
  },

  async replaceMenu(id: number, newMenu: Menu) {
    const menuList = await menuListApi.getMenuList();
    if (menuList.find(menu => menu.id === id) == null) {
      return;
    }

    setMenuList([
      ...menuList.filter(menu => menu.id !== id),
      newMenu,
    ]);
  },
} as const;
