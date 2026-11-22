<script setup lang="ts">
import { computed } from 'vue';
import type { Menu } from '@prisma-generated-client';
import BaseDialog from '@src/components/common/BaseDialog.vue';
import { useInstantPresetStore } from '@src/stores/instant-preset';
import { menuUnitMap } from '@common/util';

const instantPreset = useInstantPresetStore();

const props = defineProps<{
  allMenuList: Menu[],
}>();

const model = defineModel<boolean>({ required: true });

const addableMenuSelect = computed(() => props.allMenuList
  .filter(menu => !instantPreset.menuList.some(item => item.menu.id === menu.id))
  .map(menu => ({
    title: menu.name,
    value: menu.id,
  }))
);

const onSelectMenuToAdd = (menuId: Menu['id'] | null) => {
  const menu = props.allMenuList.find(menu => menu.id === menuId);
  if (menu !== undefined) {
    instantPreset.addMenu(menu);
  }
};
</script>

<template>
  <BaseDialog v-model="model">
    <div class="d-flex flex-column ga-6">
      <h3 class="text-h5">即席プリセット</h3>
      <p class="text-body-2">ここで設定したメニューはアプリを終了するまで保持されます</p>
      <VTable v-if="instantPreset.menuList.length >= 1" class="border rounded">
        <tbody>
          <tr v-for="item of instantPreset.menuList" :key="item.menu.id">
            <td class="text-left">{{ item.menu.name }}</td>
            <td>
              <div class="d-flex align-center ga-2">
                ×
                <VNumberInput
                  v-model="item.multiplier"
                  hide-details
                  variant="outlined"
                  density="compact"
                  control-variant="stacked"
                  :precision="1"
                  :step="0.5"
                  :min="0.5"
                />
                {{ menuUnitMap[item.menu.unit] }}
              </div>
            </td>
            <td class="text-right">
              <VBtn
                flat
                icon="mdi-trash-can"
                color="red"
                variant="text"
                @click="instantPreset.removeMenu(item.menu.id)"
              />
            </td>
          </tr>
        </tbody>
      </VTable>
      <!-- NOTE: 追加操作のためのセレクトなので、選択値は保持せず常に未選択表示にする -->
      <VSelect
        :model-value="null"
        label="メニューを追加"
        prepend-inner-icon="mdi-plus"
        rounded
        variant="outlined"
        hide-details
        no-data-text="追加できるメニューがありません"
        :items="addableMenuSelect"
        @update:model-value="onSelectMenuToAdd"
      />
    </div>
  </BaseDialog>
</template>
