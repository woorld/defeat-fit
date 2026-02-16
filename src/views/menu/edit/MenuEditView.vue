<script setup lang="ts">
import { ref } from 'vue';
import MenuTableRow from './components/MenuTableRow.vue';
import type { Menu } from '@prisma-generated-client';
import ItemEmptyCard from '@src/components/common/ItemEmptyCard.vue';

const menuList = ref<Menu[]>([]);
const editingMenuId = ref<null | number>(null); // 0の場合は新規追加

const getMenuList = async () => {
  const fetchedMenuList = await window.menu.getMenuList();
  fetchedMenuList.sort((menuA, menuB) => menuA.id - menuB.id);
  menuList.value = fetchedMenuList;
};

const addMenu = async (menu: Menu) => {
  await window.menu.addMenu(menu);
  getMenuList();
};

const replaceMenu = async (menu: Menu) => {
  await window.menu.replaceMenu(menu.id, menu);
  getMenuList();
};

const deleteMenu = async (id: number) => {
  await window.menu.deleteMenu(id);
  getMenuList();
};

const updateEditingMenuId = (id: null | number) => {
  editingMenuId.value = id;
};

(async () => {
  getMenuList();
})();
</script>

<template>
  <div class="d-flex justify-center flex-column">
    <ItemEmptyCard v-if="menuList.length <= 0 && editingMenuId === null" itemName="メニュー" />
    <VTable v-else hover :items="menuList">
      <thead>
        <tr class="font-weight-bold">
          <td>メニュー名</td>
          <td>単位</td>
          <td />
        </tr>
      </thead>
      <tbody>
        <MenuTableRow
          v-for="menu of menuList"
          :key="menu.id"
          :menu
          :editingMenuId
          @replace-menu="replaceMenu"
          @delete-menu="deleteMenu"
          @update-editing-menu-id="updateEditingMenuId"
        />
        <!-- 新規追加用の行 -->
        <MenuTableRow
          v-show="editingMenuId === 0"
          :menu="null"
          :editingMenuId
          @add-menu="addMenu"
          @update-editing-menu-id="updateEditingMenuId"
        />
      </tbody>
    </VTable>
    <VBtn
      class="mt-6 mx-auto"
      :disabled="editingMenuId !== null"
      rounded
      prepend-icon="mdi-plus"
      @click="editingMenuId = 0"
    >メニューを追加</VBtn>
  </div>
</template>
