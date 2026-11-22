import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { Menu } from '@prisma-generated-client';
import type { MenuWithMultiplier } from '@common/types';

// NOTE: 一時的に使用する前提のため、DBやelectron-storeには保存せずアプリ起動中のみ保持する
export const useInstantPresetStore = defineStore('instant-preset', () => {
  const menuList = ref<MenuWithMultiplier[]>([]);

  const addMenu = (menu: Menu) => {
    if (menuList.value.some(item => item.menu.id === menu.id)) {
      return;
    }
    menuList.value.push({ menu, multiplier: 1 });
  };

  const removeMenu = (menuId: Menu['id']) => {
    menuList.value = menuList.value.filter(item => item.menu.id !== menuId);
  };

  // メニュー画面での削除・編集を反映する（削除済みメニューのまま統計登録すると失敗するため）
  const syncMenus = (allMenuList: Menu[]) => {
    menuList.value = menuList.value.flatMap(item => {
      const menu = allMenuList.find(menu => menu.id === item.menu.id);
      return menu === undefined ? [] : [{ ...item, menu }];
    });
  };

  return {
    menuList,
    addMenu,
    removeMenu,
    syncMenus,
  };
});
