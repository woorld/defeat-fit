<script setup lang="ts">
import { ref } from 'vue';
import MenuTableRow from '../components/MenuTableRow.vue';
import type { Menu } from '../../common/types';
import ViewHeading from '../components/ViewHeading.vue';

const menuList = ref<Menu[]>([]);
const editingMenuId = ref<null | number>(null);

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
  updateMenu();
};

const updateMenu = async () => {
  menuList.value = await window.menuList.getMenuList();
};

const updateEditingMenu = (id: null | number) => {
  editingMenuId.value = id;
};

(async () => {
  menuList.value = await window.menuList.getMenuList();
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
          :menu
          :editingMenuId
          @update-menu="updateMenu"
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
