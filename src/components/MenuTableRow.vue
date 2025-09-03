<script setup lang="ts">
import { ref, computed } from 'vue';
import type { Menu, MenuUnit } from '../../electron/api/menu-list'; // HACK: フロントからバックのものをインポートするのってあまりよくない？

const unitType: MenuUnit[] = ['回', '秒'];

const props = defineProps<{
  menu: Menu,
  editingMenuId: null | number,
}>();

const emit = defineEmits<{
  (e: 'update-menu'): void,
  (e: 'update-editing-menu', id: null | number): void,
}>();

const name = ref(props.menu.name);
const multiplier = ref(props.menu.multiplier);
const unit = ref(props.menu.unit);

const canEdit = computed(() => props.editingMenuId === props.menu.id);
const isLockBtn = computed(() => props.editingMenuId !== null && props.editingMenuId !== props.menu.id);

const editMenu = async () => {
  if (!canEdit.value) {
    emit('update-editing-menu', props.menu.id);
    return;
  }

  await window.menuList.replaceMenu(props.menu.id, {
    id: props.menu.id,
    name: name.value,
    multiplier: multiplier.value,
    unit: unit.value,
  });
  emit('update-menu');
  emit('update-editing-menu', null);
};

const deleteMenu = async (id: number) => {
  await window.menuList.deleteMenu(id);
  if (props.editingMenuId === props.menu.id) {
    emit('update-editing-menu', null);
  }
  emit('update-menu');
};
</script>

<template>
  <tr :class="{'active': canEdit}">
    <template v-if="canEdit">
      <td class="px-2">
        <VTextField
          class="menu-input"
          label="メニュー名"
          v-model="name"
          variant="outlined"
          single-line
          density="compact"
          center-affix
          hide-details
          autofocus
        />
      </td>
      <td class="px-2">
        <VNumberInput
          class="menu-input"
          v-model="multiplier"
          inset
          variant="outlined"
          hide-details
          density="compact"
          max-width="100"
          control-variant="stacked"
          :step="0.5"
          :precision="1"
          :min="0.5"
        />
      </td>
      <td class="px-2">
        <VSelect
          class="menu-input"
          v-model="unit"
          variant="outlined"
          density="compact"
          hide-details
          :items="unitType"
        />
      </td>
    </template>
    <template v-else>
      <td>{{ props.menu.name }}</td>
      <td>{{ props.menu.multiplier }}</td>
      <td>{{ props.menu.unit }}</td>
    </template>
    <td class="text-right">
      <VBtn
        :class="{'text-green': canEdit}"
        :disabled="isLockBtn"
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
        icon="mdi-close"
        @click="deleteMenu(props.menu.id)"
      />
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
