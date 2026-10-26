<script setup lang="ts">
import { ref, computed } from 'vue';
import type { PresetWithMenus } from '@common/types';
import { menuUnitMap, calcMenuAmount, isMenuAmountCapped } from '@common/util';
import { useDefeatCountStore } from '@src/stores/defeat-count';
import DoMenuDialog from './DoMenuDialog.vue';

const defeatCount = useDefeatCountStore();

const props = defineProps<{
  presetMenu: PresetWithMenus['presetMenuList'][number],
}>();

const isDialogVisible = ref(false);

const menuAmount = computed(
  () => calcMenuAmount(props.presetMenu.multiplier, defeatCount.count, props.presetMenu.menu.maxValue)
);
const isCapped = computed(
  () => isMenuAmountCapped(props.presetMenu.multiplier, defeatCount.count, props.presetMenu.menu.maxValue)
);
</script>

<template>
  <tr class="cursor-pointer" @click="isDialogVisible = true">
    <td class="menu-name">{{ props.presetMenu.menu.name }}</td>
    <td>× {{ props.presetMenu.multiplier }} {{ menuUnitMap[props.presetMenu.menu.unit] }}</td>
    <td class="text-right">
      <span
        class="pt-1 pb-1 pr-2 pl-2 rounded"
        :class="{ 'text-warning': isCapped }"
      >{{ menuAmount }} {{ menuUnitMap[props.presetMenu.menu.unit] }}</span>
    </td>
    <td class="text-right">
      <VIcon>mdi-chevron-right</VIcon>
    </td>
  </tr>
  <DoMenuDialog v-model="isDialogVisible" :presetMenu="props.presetMenu" />
</template>

<style scoped>
.menu-name {
  width: 50%;
}
</style>
