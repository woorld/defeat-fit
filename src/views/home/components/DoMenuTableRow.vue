<script setup lang="ts">
import { ref } from 'vue';
import type { PresetWithMenus } from '@common/types';
import { menuUnitMap } from '@common/util';
import { useDefeatCountStore } from '@src/stores/defeat-count';
import DoMenuDialog from './DoMenuDialog.vue';

const defeatCount = useDefeatCountStore();

const props = defineProps<{
  presetMenu: PresetWithMenus['presetMenuList'][number],
}>();

const isDialogVisible = ref(false);
</script>

<template>
  <tr class="cursor-pointer" @click="isDialogVisible = true">
    <td>{{ props.presetMenu.menu.name }}</td>
    <td>× {{ props.presetMenu.multiplier }} {{ menuUnitMap[props.presetMenu.menu.unit] }}</td>
    <td class="text-right">
      <span
        class="pt-1 pb-1 pr-2 pl-2 rounded"
      >{{ Math.ceil(props.presetMenu.multiplier * defeatCount.count) }} {{ menuUnitMap[props.presetMenu.menu.unit] }}</span>
    </td>
    <td class="text-right">
      <VIcon>mdi-chevron-right</VIcon>
    </td>
  </tr>
  <DoMenuDialog v-model="isDialogVisible" :presetMenu="props.presetMenu" />
</template>
