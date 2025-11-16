<script setup lang="ts">
// TODO: プリセット編集がメインの画面なので、他と重複しなければ変数・関数のPresetというプレフィクスは不要そう
import { ref, computed } from 'vue';
import { PresetWithMenus } from '../../common/types';
import type { Menu } from '../../prisma/generated/client';
import PresetMenuEditor from '../components/PresetMenuEditor.vue';
import ConfirmDialog from '../components/ConfirmDialog.vue';

const presetName = ref('');
const presetList = ref<PresetWithMenus[]>([]);

/**
 * null: プリセットなし(初期状態)
 * 0:    新規作成
 * 1~:   既存プリセットの編集
 */
const editingPresetId = ref<number | null>(null);
const menuList = ref<Menu[]>([]);
const menuListInPreset = ref<Menu[]>([]);
const menuMultiplierList = ref<number[]>([]);
const isDeleteDialogVisible = ref(false);

const presetSelect = computed(() => presetList.value.map(preset => ({
  title: preset.name,
  value: preset.id,
})));

const canEditPreset = computed(() => editingPresetId.value !== null);
const canSavePreset = computed(() => presetName.value.length >= 1 && menuListInPreset.value.length >= 1);

const getPresetList = async () => {
  presetList.value = await window.preset.getPresetList();
};

const setEditingPreset = async (preset: PresetWithMenus) => {
  // TODO: presetIdをとるようにする
  presetName.value = preset.name;
  editingPresetId.value = preset.id;
  menuListInPreset.value = preset.presetMenuList.map(presetMenu => presetMenu.menu);
  menuMultiplierList.value = preset.presetMenuList.map(presetMenu => presetMenu.multiplier);
  const fetchedMenuList = await window.menuList.getMenuList();
  menuList.value = fetchedMenuList.filter(menu => !menuListInPreset.value.map(menu => menu.id).includes(menu.id));
};

const onSelectPreset = async (id: number) => {
  const preset = presetList.value.find(preset => preset.id === id);
  if (preset === undefined) {
    return;
  }
  setEditingPreset(preset);
};

const onClickAddPreset = () => {
  setEditingPreset({
    id: 0,
    name: '',
    presetMenuList: [],
  });
};

const onClickSavePreset = async () => {
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

// TODO: editingPresetId.value = nullとしているところをsetEditingPreset(null)とする
// TODO: presetList.value.length >= 1を汎用化

const onClickDiscardPreset = () => {
  if (editingPresetId.value === 0) {
    if (presetList.value.length <= 0) {
      editingPresetId.value = null;
      return;
    }
    setEditingPreset(presetList.value[0]);
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

  if (presetList.value.length >= 1) {
    setEditingPreset(presetList.value[0]);
    return;
  }
  editingPresetId.value = null;
};

(async () => {
  await getPresetList();
  if (presetList.value.length >= 1) {
    setEditingPreset(presetList.value[0]);
    return;
  }
  menuList.value = await window.menuList.getMenuList();
})();
</script>

<template>
  <div>
    <VCard
      v-if="!canEditPreset"
      class="mb-6 py-8 text-center"
      title="プリセットがありません"
    />
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
        @update:modelValue="v => onSelectPreset(v)"
      />
      <VBtn
        rounded
        prepend-icon="mdi-plus"
        :disabled="editingPresetId === 0"
        @click="onClickAddPreset"
      >プリセットを追加</VBtn>
    </div>
    <template v-if="canEditPreset">
      <div class="d-flex justify-center align-center ga-2 mb-4">
        <VTextField
          v-model="presetName"
          hide-details
          placeholder="プリセット名"
        />
        <VBtn
          icon="mdi-floppy"
          color="green"
          :disabled="!canSavePreset"
          @click="onClickSavePreset"
        />
        <VBtn
          :icon="`mdi-${editingPresetId === 0 ? 'close' : 'trash-can'}`"
          color="red"
          @click="onClickDiscardPreset"
        />
      </div>
      <PresetMenuEditor
        v-model:menuList="menuList"
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
        本当に {{ presetName }} を削除する？<br />
      </ConfirmDialog>
    </template>
  </div>
</template>
