import Store from 'electron-store';

export type MenuUnit = '回' | '秒';

export type Menu = {
  id: number,
  name: string,
  multiplier: number,
  unit: MenuUnit,
};

const store = new Store<Menu[]>();

const setMenuList = (menuList: Menu[]) => store.set('menuList', menuList);

export const getMenuList = async (): Promise<Menu[]> => await store.get('menuList') || [];

export const addMenu = async (menu: Menu) => {
  const menuList = await getMenuList();
  setMenuList([ ...menuList, menu ]);
};

export const deleteMenu = async (id: number) => {
  const menuList = await getMenuList();
  setMenuList(menuList.filter(menu => menu.id !== id));
};

export const replaceMenu = async (id: number, newMenu: Menu) => {
  const menuList = await getMenuList();
  if (menuList.find(menu => menu.id === id) == null) {
    return;
  }

  setMenuList([
    ...menuList.filter(menu => menu.id !== id),
    newMenu,
  ]);
};
