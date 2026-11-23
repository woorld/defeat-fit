<script setup lang="ts">
import { menuUnitMap } from '@common/util';
import { Menu, MenuUnit } from '@prisma-generated-client';
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
    <p class="text-subtitle-1 mb-1">{{ props.title }}</p>
    <VSheet class="fill-height rounded" border>
      <!-- NOTE: カードだと1件あたりの高さが大きく一覧性が下がるため、1行のリスト表示にしている -->
      <!-- NOTE: vuedraggableの#itemスロットは単一要素しか許容せず、devではコメントも要素数に数えられるため、コメントはスロット外に置く -->
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
          <div class="menu-row d-flex align-center ga-2 px-2">
            <VIcon icon="mdi-drag" size="small" class="flex-shrink-0 cursor-grab" />
            <span class="text-body-2 text-truncate flex-grow-1" :title="menu.name">{{ menu.name }}</span>
            <div v-if="menuMultiplierList !== undefined" class="d-flex align-center flex-shrink-0 ga-1">
              <VNumberInput
                v-model="menuMultiplierList[index]"
                class="multiplier-input"
                hide-details
                variant="outlined"
                density="compact"
                control-variant="stacked"
                :precision="1"
                :step="0.5"
                :min="0.5"
              />
              <!-- NOTE: menu: Menu & { multiplier?: number } なので型アサーションしてOK -->
              <span class="text-body-2">{{ menuUnitMap[menu.unit as MenuUnit] }}</span>
            </div>
          </div>
        </template>
      </Draggable>
    </VSheet>
  </VCol>
</template>

<style scoped>
.menu-row {
  min-height: 44px;
  border-bottom: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.multiplier-input {
  width: 96px;
}

.multiplier-input :deep(.v-field__input) {
  font-size: 0.875rem;
}
</style>
