<script setup lang="ts">
import type { Menu } from '@prisma-generated-client';
import type { SortableEvent } from 'sortablejs';
import PresetMenuEditorCol from './PresetMenuEditorCol.vue';

const menuList = defineModel<Menu[]>('menuList', { required: true });
const menuListInPreset = defineModel<Menu[]>('menuListInPreset', { required: true });
const menuMultiplierList = defineModel<number[]>('menuMultiplierList', { required: true });

const onAddMenu = (event: SortableEvent) => {
  if (event.newIndex === undefined) {
    return;
  }
  menuMultiplierList.value.splice(event.newIndex, 0, 1);
};

const onUpdateMenuOrder = (event: SortableEvent) => {
  if (event.newIndex === undefined || event.oldIndex === undefined) {
    return;
  }
  // 移動したメニューの倍率を対応する位置に移動
  const targetMultiplier = menuMultiplierList.value.splice(event.oldIndex, 1)[0];
  menuMultiplierList.value.splice(event.newIndex, 0, targetMultiplier)
};

const onRemoveMenu = (event: SortableEvent) => {
  if (event.oldIndex === undefined) {
    return;
  }
  menuMultiplierList.value.splice(event.oldIndex, 1);
};
</script>

<template>
  <VRow>
    <PresetMenuEditorCol
      v-model:menuList="menuList"
      title="メニュー一覧"
    />
    <PresetMenuEditorCol
      v-model:menuList="menuListInPreset"
      v-model:menuMultiplierList="menuMultiplierList"
      title="プリセット内のメニュー"
      @add-menu="onAddMenu"
      @update-menu-order="onUpdateMenuOrder"
      @remove-menu="onRemoveMenu"
    />
  </VRow>
</template>
