<script setup lang="ts">
import { ref, computed, toRaw } from 'vue';
import type { Menu, MenuUnit } from '../../prisma/generated/client';
import ConfirmDialog from './ConfirmDialog.vue';
import { menuUnitMap } from '../../common/util';

type UnitSelectItem = {
  title: string,
  value: MenuUnit,
};

const unitSelectItems: UnitSelectItem[] = [
  { title: '回', value: 'COUNT' },
  { title: '秒', value: 'SECOND' },
] as const;

const menuDefaultValue: Menu = {
  id: 0,
  name: '',
  unit: 'COUNT',
} as const;

const props = defineProps<{
  menu: Menu | null, // nullの場合は新規追加
  editingMenuId: null | number,
}>();

const emit = defineEmits<{
  (e: 'add-menu', menu: Menu): void,
  (e: 'replace-menu', menu: Menu): void,
  (e: 'delete-menu', id: number): void,
  (e: 'update-editing-menu-id', id: null | number): void,
}>();

const menu = ref<Menu>(props.menu
  ? { ...props.menu }
  : { ...menuDefaultValue }
);
const isDeleteDialogVisible = ref(false);

const canEdit = computed(() => props.editingMenuId === menu.value.id);
const isLockBtn = computed(() => props.editingMenuId !== null && props.editingMenuId !== menu.value.id);

const editMenu = async () => {
  if (!canEdit.value) {
    // メニューを編集中にする
    emit('update-editing-menu-id', menu.value.id);
    return;
  }

  if (props.menu === null) {
    emit('add-menu', toRaw(menu.value));
    menu.value = { ...menuDefaultValue };
  }
  else {
    emit('replace-menu', toRaw(menu.value));
  }
  emit('update-editing-menu-id', null);
};

const onDeleteMenu = async (id: number) => {
  isDeleteDialogVisible.value = false;
  emit('delete-menu', id);
  if (props.editingMenuId === menu.value.id) {
    emit('update-editing-menu-id', null);
  }
};

const onClickDiscard = () => {
  if (props.menu === null) {
    // 追加用の行を非表示にする
    emit('update-editing-menu-id', null);
    return;
  }
  isDeleteDialogVisible.value = true;
};
</script>

<template>
  <tr :class="{'active': canEdit}">
    <template v-if="canEdit">
      <td class="px-2">
        <!-- HACK: rulesを未入力時の赤枠表示用に使用 -->
        <VTextField
          class="menu-input"
          label="メニュー名"
          v-model="menu.name"
          variant="outlined"
          single-line
          density="compact"
          center-affix
          hide-details
          autofocus
          :rules="[v => v.length >= 1]"
        />
      </td>
      <td class="px-2">
        <VSelect
          class="menu-input"
          v-model="menu.unit"
          variant="outlined"
          density="compact"
          hide-details
          :items="unitSelectItems"
        />
      </td>
    </template>
    <template v-else>
      <td>{{ menu.name }}</td>
      <td>{{ menuUnitMap[menu.unit] }}</td>
    </template>
    <td class="text-right">
      <VBtn
        :class="{'text-green': canEdit}"
        :disabled="isLockBtn || menu.name.length <= 0"
        size="small"
        elevation="0"
        :icon="canEdit ? 'mdi-check' : 'mdi-pencil'"
        @click="editMenu"
      />
      <VBtn
        class="text-red ml-1"
        :disabled="isLockBtn"
        size="small"
        elevation="0"
        :icon="props.menu === null ? 'mdi-close' : 'mdi-trash-can'"
        @click="onClickDiscard"
      />
      <ConfirmDialog
        v-model="isDeleteDialogVisible"
        title="メニュー削除"
        yesBtnColor="red"
        reverseYesNoPosition
        @click-yes="onDeleteMenu(menu.id)"
        @click-no="isDeleteDialogVisible = false"
      >
        本当に {{ menu.name }} を削除しますか？<br />
        <span class="text-red">※統計からも削除されます</span>
      </ConfirmDialog>
    </td>
  </tr>
</template>

<style scoped>
.menu-input:deep(.v-field-label) {
  font-size: 14px;
}

.menu-input:deep(.v-field__input) {
  font-size: 14px;
  padding: unset 0;
}

.menu-input:deep(.v-field__append-inner) {
  padding: 0;
  align-items: center;
}
</style>
