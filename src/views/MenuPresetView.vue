<script setup lang="ts">
// TODO: プリセットがない場合の表示と処理
// TODO: 空のプリセットを許容しないようにする
import { ref, computed } from 'vue';
import { PresetWithMenus } from '../../common/types';
import type { Menu } from '../../prisma/generated/client';
import PresetMenuEditor from '../components/PresetMenuEditor.vue';

const presetName = ref('');
const presetList = ref<PresetWithMenus[]>([]);
const editingPresetId = ref(0);

const menuList = ref<Menu[]>([]);
const menuListInPreset = ref<Menu[]>([]);
const menuMultiplierList = ref<number[]>([]);

const presetSelect = computed(() => presetList.value.map(preset => ({
  title: preset.name,
  value: preset.id,
})));

const getPresetList = async () => {
  presetList.value = await window.preset.getPresetList();
};

const selectPreset = async (id: number) => {
  const preset = presetList.value.find(preset => preset.id === id);
  if (preset === undefined) {
    return;
  }

  presetName.value = preset.name;
  editingPresetId.value = preset.id;
  menuListInPreset.value = preset.presetMenuList.map(presetMenu => presetMenu.menu);
  menuMultiplierList.value = preset.presetMenuList.map(presetMenu => presetMenu.multiplier);

  const fetchedMenuList = await window.menuList.getMenuList();
  menuList.value = fetchedMenuList.filter(menu => !menuListInPreset.value.map(menu => menu.id).includes(menu.id));
};

const onSave = async () => {
  const menuIdWithMultiplierList = menuListInPreset.value.map((menu, index) => ({
    menuId: menu.id,
    multiplier: menuMultiplierList.value[index],
  }));

  if (editingPresetId.value === 0) {
    // プリセット新規登録
    const preset = await window.preset.addPreset(
      presetName.value,
      menuIdWithMultiplierList
    );
    editingPresetId.value = preset.id;
  }
  else {
    // プリセット更新
    const preset = {
      id: editingPresetId.value,
      name: presetName.value,
    };
    await window.preset.updatePreset(preset, menuIdWithMultiplierList);
  }

  getPresetList();
};

(async () => {
  await getPresetList();
  if (presetList.value.length >= 1) {
    selectPreset(presetList.value[0].id);
    return;
  }
  menuList.value = await window.menuList.getMenuList();
})();
</script>

<template>
  <div>
    <div class="d-flex justify-center align-center mb-8">
      <VSelect
        v-if="editingPresetId !== 0"
        v-model="editingPresetId"
        class="mr-4"
        hide-details
        variant="solo"
        density="compact"
        rounded
        :items="presetSelect"
        @update:modelValue="v => selectPreset(v)"
      />
      <VBtn
        rounded
        prepend-icon="mdi-plus"
      >プリセットを追加</VBtn>
    </div>
    <div class="d-flex justify-center align-center ga-2 mb-4">
      <VTextField hide-details placeholder="プリセット名" v-model="presetName" />
      <VBtn
        icon="mdi-floppy"
        color="green"
        :disabled="menuListInPreset.length <= 0"
        @click="onSave"
      />
      <!-- TODO: 削除処理実装 -->
      <VBtn icon="mdi-trash-can" color="red" />
    </div>
    <PresetMenuEditor
      v-model:menuList="menuList"
      v-model:menuListInPreset="menuListInPreset"
      v-model:menuMultiplierList="menuMultiplierList"
    />
  </div>
</template>
