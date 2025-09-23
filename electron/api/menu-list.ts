import Store from 'electron-store';
import type { Menu } from '../../common/types';

const store = new Store<Menu[]>();

const setMenuList = (menuList: Menu[]) => store.set('menuList', menuList);

export const menuListApi = {
  getMenuList: async (): Promise<Menu[]> => await store.get('menuList', []),

  addMenu: async (menu: Menu) => {
    const menuList = await menuListApi.getMenuList();
    setMenuList([ ...menuList, menu ]);
  },

  deleteMenu: async (id: number) => {
    const menuList = await menuListApi.getMenuList();
    setMenuList(menuList.filter(menu => menu.id !== id));
  },

  replaceMenu: async (id: number, newMenu: Menu) => {
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
