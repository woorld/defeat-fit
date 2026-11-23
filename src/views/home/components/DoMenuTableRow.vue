<script setup lang="ts">
import { ref, computed } from 'vue';
import type { PresetWithMenus } from '@common/types';
import { menuUnitMap, calcMenuAmount, calcRawMenuAmount, isMenuAmountCapped } from '@common/util';
import { useDefeatCountStore } from '@src/stores/defeat-count';
import DoMenuDialog from './DoMenuDialog.vue';
import MenuAmountText from '@src/components/common/MenuAmountText.vue';

const defeatCount = useDefeatCountStore();

const props = defineProps<{
  presetMenu: PresetWithMenus['presetMenuList'][number],
}>();

const isDialogVisible = ref(false);

const menuAmount = computed(
  () => calcMenuAmount(props.presetMenu.multiplier, defeatCount.count, props.presetMenu.menu.maxValue)
);
const selfMenuAmount = computed(
  () => calcRawMenuAmount(props.presetMenu.multiplier, defeatCount.selfCount)
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
      <MenuAmountText
        class="pt-1 pb-1 pr-2 pl-2 rounded"
        :count="menuAmount"
        :manualCount="selfMenuAmount"
        :unit="props.presetMenu.menu.unit"
        :isCountCapped="isCapped"
      />
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
