<script setup lang="ts">
import { menuUnitMap } from '../../common/util';
import { Menu, MenuUnit } from '../../prisma/generated/client';
import Draggable from 'vuedraggable';
import type { SortableEvent } from 'sortablejs';

const props = defineProps<{
  title: string,
}>();

const emit = defineEmits<{
  (e: 'add-menu', event: SortableEvent): void,
  (e: 'update-menu-order', event: SortableEvent): void,
  (e: 'remove-menu', event: SortableEvent): void,
}>();

const menuList = defineModel<Menu[]>('menuList', { required: true });
const menuMultiplierList = defineModel<number[]>('menuMultiplierList');
</script>

<template>
  <!-- NOTE: 縦方向のflexはメニュー領域の伸縮と左右で高さを揃えるのに必要 -->
  <VCol cols="6" class="d-flex flex-column">
    <p class="text-h6 mb-2">{{ props.title }}</p>
    <VSheet class="fill-height rounded" border>
      <Draggable
        v-model="menuList"
        item-key="id"
        animation="300"
        group="menu"
        class="fill-height overflow-hidden"
        @add="(event: SortableEvent) => emit('add-menu', event)"
        @update="(event: SortableEvent) => emit('update-menu-order', event)"
        @remove="(event: SortableEvent) => emit('remove-menu', event)"
      >
        <template #item="{ element: menu, index }">
          <VCard
            border
            :title="menu.name"
            class="ma-2"
            prepend-icon="mdi-drag"
            density="compact"
          >
            <template #text v-if="menuMultiplierList !== undefined">
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
      </Draggable>
    </VSheet>
    </VCol>
</template>
