<script setup lang="ts">
import type { Menu, MenuUnit } from '../../prisma/generated/client';
import type { SortableEvent } from 'sortablejs';
import Draggable from 'vuedraggable';
import { menuUnitMap } from '../../common/util';

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
    <!-- TODO: 共通化できる部分をコンポーネントに抽出 -->
    <VCol cols="6">
      <p class="text-h6 mb-2">メニュー一覧</p>
      <VSheet class="h-100 rounded" border>
        <Draggable
          v-model="menuList"
          item-key="key"
          animation="300"
          group="menu"
          class="h-100 overflow-hidden"
        >
          <template #item="{ element: menu }">
            <VCard
              border
              :title="menu.name"
              class="ma-2"
              prepend-icon="mdi-drag"
              density="compact"
            />
          </template>
        </Draggable>
      </VSheet>
    </VCol>
    <VCol cols="6">
      <p class="text-h6 mb-2">プリセット内のメニュー</p>
      <VSheet class="h-100 rounded" border>
        <draggable
          v-model="menuListInPreset"
          item-key="id"
          animation="300"
          group="menu"
          class="h-100 overflow-hidden"
          @add="onAddMenu"
          @update="onUpdateMenuOrder"
          @remove="onRemoveMenu"
        >
          <template #item="{ element: menu, index }">
            <VCard
              border
              :title="menu.name"
              class="ma-2"
              prepend-icon="mdi-drag"
              density="compact"
            >
              <template #text>
                <div class="d-flex justify-center align-center">
                  <VNumberInput
                    v-model="menuMultiplierList[index]"
                    class="mr-4"
                    hide-details
                    variant="outlined"
                    density="compact"
                    control-variant="stacked"
                    :precision="1"
                    :step="0.5"
                    :min="0.5"
                  />
                  <!-- NOTE: menu: Menu & { multiplier?: number } なので型アサーションしてOK -->
                  {{ menuUnitMap[menu.unit as MenuUnit] }}
                </div>
              </template>
            </VCard>
          </template>
        </draggable>
      </VSheet>
    </VCol>
  </VRow>
</template>
