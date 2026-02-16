<script setup lang="ts">
import { ref, computed } from 'vue';
import type { PresetWithMenus } from '@common/types';
import type { Menu } from '@prisma-generated-client';
import PresetMenuEditor from './components/PresetMenuEditor.vue';
import ConfirmDialog from '@src/components/common/ConfirmDialog.vue';
import ItemEmptyCard from '@src/components/common/ItemEmptyCard.vue';
import ItemEmptyCardWithNav from '@src/components/common/ItemEmptyCardWithNav.vue';

const presetName = ref('');
const presetList = ref<PresetWithMenus[]>([]);

/**
 * null: プリセットなし(初期状態)
 * 0:    新規作成
 * 1~:   既存プリセットの編集
 */
const editingPresetId = ref<number | null>(null);
const allMenuList = ref<Menu[]>([]); // NOTE: <template>から読まれないが、Computedで使用するためRefで定義
const menuListInLeftPane = ref<Menu[]>([]);
const menuListInPreset = ref<Menu[]>([]);
const menuMultiplierList = ref<number[]>([]);
const isDeleteDialogVisible = ref(false);

const presetSelect = computed(() => presetList.value.map(preset => ({
  title: preset.name,
  value: preset.id,
})));
const hasPreset = computed(() => presetList.value.length >= 1);
const canAddPreset = computed(() =>  allMenuList.value.length >= 1);
const canEditPreset = computed(() => editingPresetId.value !== null);
const canSavePreset = computed(() => presetName.value.length >= 1 && menuListInPreset.value.length >= 1);

const getPresetList = async () => {
  presetList.value = await window.preset.getPresetList();
};

const setEditingPresetById = async (id: number | null) => {
  if (id === null || id === 0) {
    presetName.value = '';
    editingPresetId.value = id;
    menuListInPreset.value = [];
    menuMultiplierList.value = [];
    menuListInLeftPane.value = [ ...allMenuList.value ];
    return;
  }

  const preset = presetList.value.find(preset => preset.id === id);
  if (preset === undefined) {
    return;
  }

  presetName.value = preset.name;
  editingPresetId.value = preset.id;
  menuListInPreset.value = preset.presetMenuList.map(presetMenu => presetMenu.menu);
  menuMultiplierList.value = preset.presetMenuList.map(presetMenu => presetMenu.multiplier);
  menuListInLeftPane.value = allMenuList.value.filter(menu => !menuListInPreset.value.map(menu => menu.id).includes(menu.id));
};

const onClickSave = async () => {
  if (editingPresetId.value === null) {
    return;
  }

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

const onClickDiscard = () => {
  if (editingPresetId.value === 0) {
    setEditingPresetById(hasPreset.value ? presetList.value[0].id : null);
    return;
  }
  isDeleteDialogVisible.value = true;
};

const deletePreset = async () => {
  isDeleteDialogVisible.value = false;
  if (editingPresetId.value === null) {
    return;
  }

  await window.preset.deletePreset(editingPresetId.value);
  await getPresetList();

  setEditingPresetById(hasPreset.value ? presetList.value[0].id : null);
};

(async () => {
  const result = await Promise.all([
    window.menu.getMenuList(),
    getPresetList(),
  ]);
  allMenuList.value = result[0];
  setEditingPresetById(hasPreset.value ? presetList.value[0].id : null);
})();
</script>

<template>
  <div>
    <div class="mb-6">
      <ItemEmptyCardWithNav
        v-if="!canAddPreset"
        title="プリセットに設定できるメニューがありません"
        text="プリセットの作成にはメニューが必要です"
      />
      <ItemEmptyCard v-else-if="!canEditPreset" itemName="プリセット" />
    </div>
    <!-- HACK: 他の要素より表示・非表示が多くなるのでv-showにしたいが、display: noneがd-flexで上書きされるため使えない -->
    <div v-if="editingPresetId !== 0" class="d-flex justify-center align-center mb-8">
      <VSelect
        v-if="presetList.length >= 1"
        v-model="editingPresetId"
        class="mr-4"
        hide-details
        variant="solo"
        density="compact"
        rounded
        :items="presetSelect"
        @update:modelValue="setEditingPresetById"
      />
      <VBtn
        v-if="canAddPreset"
        rounded
        prepend-icon="mdi-plus"
        :disabled="editingPresetId === 0"
        @click="setEditingPresetById(0)"
      >プリセットを追加</VBtn>
    </div>
    <template v-if="canEditPreset">
      <div class="d-flex justify-center align-center ga-2 mb-4">
        <!-- HACK: rulesを未入力時の赤枠表示用に使用 -->
        <VTextField
          v-model="presetName"
          hide-details
          label="プリセット名"
          variant="outlined"
          :rules="[v => v.length >= 1]"
        />
        <VBtn
          icon="mdi-floppy"
          color="green"
          :disabled="!canSavePreset"
          @click="onClickSave"
        />
        <VBtn
          :icon="`mdi-${editingPresetId === 0 ? 'close' : 'trash-can'}`"
          color="red"
          @click="onClickDiscard"
        />
      </div>
      <PresetMenuEditor
        v-model:menuList="menuListInLeftPane"
        v-model:menuListInPreset="menuListInPreset"
        v-model:menuMultiplierList="menuMultiplierList"
      />
      <ConfirmDialog
        v-model="isDeleteDialogVisible"
        title="プリセット削除"
        yesBtnColor="red"
        reverseYesNoPosition
        @click-yes="deletePreset"
        @click-no="isDeleteDialogVisible = false"
      >
        本当に {{ presetName }} を削除しますか？<br />
      </ConfirmDialog>
    </template>
  </div>
</template>
