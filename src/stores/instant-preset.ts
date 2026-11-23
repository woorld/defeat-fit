import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { Menu } from '@prisma-generated-client';
import type { MenuWithMultiplier } from '@common/types';

// NOTE: 一時的に使用する前提のため、DBやelectron-storeには保存せずアプリ起動中のみ保持する
export const useInstantPresetStore = defineStore('instant-preset', () => {
  const menuList = ref<MenuWithMultiplier[]>([]);

  // ホーム画面は遷移のたびに再生成されるため、他画面から戻った際に選択状態を復元できるよう保持する
  const isSelected = ref(false);

  // メニュー画面での削除・編集を反映する（削除済みメニューのまま統計登録すると失敗するため）
  const syncMenus = (allMenuList: Menu[]) => {
    menuList.value = menuList.value.flatMap(item => {
      const menu = allMenuList.find(menu => menu.id === item.menu.id);
      return menu === undefined ? [] : [{ ...item, menu }];
    });
  };

  return {
    menuList,
    isSelected,
    syncMenus,
  };
});
