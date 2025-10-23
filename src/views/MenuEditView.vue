<script setup lang="ts">
import { ref } from 'vue';
import MenuTableRow from '../components/MenuTableRow.vue';
import type { Menu } from '../../common/types';
import ViewHeading from '../components/ViewHeading.vue';

const menuList = ref<Menu[]>([]);
const editingMenuId = ref<null | number>(null);

const getMenuList = async () => {
  const fetchedMenuList: Menu[] = await window.menuList.getMenuList();
  fetchedMenuList.sort((menuA, menuB) => menuA.id - menuB.id);
  menuList.value = fetchedMenuList;
};

// HACK: フロント側で表示だけ追加し、確定されたときにファイルに書き込んだほうがよい
const addMenu = async () => {
  const id = Date.now();
  await window.menuList.addMenu({
    id,
    name: '',
    multiplier: 1,
    unit: '回',
  });
  editingMenuId.value = id;
  getMenuList();
};

const replaceMenu = async (menu: Menu) => {
  await window.menuList.replaceMenu(menu.id, menu);
  getMenuList();
};

const deleteMenu = async (id: number) => {
  await window.menuList.deleteMenu(id);
  getMenuList();
};

const updateEditingMenu = (id: null | number) => {
  editingMenuId.value = id;
};

(async () => {
  getMenuList();
})();
</script>

<template>
  <VContainer class="d-flex justify-center flex-column">
    <ViewHeading title="メニュー編集" />
    <VTable hover :items="menuList">
      <thead>
        <tr class="font-weight-bold">
          <td>メニュー名</td>
          <td>回・秒 / 死</td>
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
          @update-editing-menu="updateEditingMenu"
        />
      </tbody>
    </VTable>
    <VBtn
      class="mt-4 mx-auto"
      :disabled="editingMenuId !== null"
      rounded
      prepend-icon="mdi-plus"
      @click="addMenu"
    >メニューを追加</VBtn>
  </VContainer>
</template>
