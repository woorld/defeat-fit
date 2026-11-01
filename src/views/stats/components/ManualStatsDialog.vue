<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { Menu } from '@prisma-generated-client';
import type { MenuIdWithManualCount, StatsWithMenus } from '@common/types';
import { menuUnitMap, getStatsDateString } from '@common/util';
import BaseDialog from '@src/components/common/BaseDialog.vue';

const props = defineProps<{
  statsList: StatsWithMenus[],
  fixedDate: string | null, // nullの場合は日付を選択可能にする
}>();

const emit = defineEmits<{
  (e: 'save'): void,
}>();

const model = defineModel<boolean>({ required: true });

const menuList = ref<Menu[]>([]);
const today = ref('');
const date = ref('');
const manualCountMap = ref<Record<Menu['id'], number>>({});
const isSaving = ref(false);

const targetStats = computed(() => props.statsList.find(stats => stats.date === date.value));
const isDateValid = computed(() => /^\d{4}-\d{2}-\d{2}$/.test(date.value) && date.value <= today.value);
const isManualCountValid = (manualCount: number) => Number.isInteger(manualCount) && manualCount >= 0;
const canSave = computed(() =>
  isDateValid.value
  && menuList.value.length >= 1
  && Object.values(manualCountMap.value).every(isManualCountValid)
);

const getStatsMenu = (menuId: Menu['id']) =>
  targetStats.value?.statsMenuList.find(statsMenu => statsMenu.menuId === menuId);

const resetManualCountMap = () => {
  manualCountMap.value = Object.fromEntries(
    menuList.value.map(menu => [menu.id, getStatsMenu(menu.id)?.manualCount ?? 0])
  );
};

const initialize = async () => {
  const [fetchedMenuList, dayBoundaryOffsetHours] = await Promise.all([
    window.menu.getMenuList(),
    window.setting.getSetting('dayBoundaryOffsetHours'),
  ]);

  menuList.value = fetchedMenuList;
  today.value = getStatsDateString(new Date(), dayBoundaryOffsetHours);
  date.value = props.fixedDate ?? today.value;
  resetManualCountMap();
};

const save = async () => {
  if (!canSave.value) {
    return;
  }

  // 既存の手動登録を0に戻す場合も送る必要があるため、統計メニューが存在するものは0でも含める
  const menuIdWithManualCountList: MenuIdWithManualCount[] = menuList.value
    .map(menu => ({ menuId: menu.id, manualCount: manualCountMap.value[menu.id] ?? 0 }))
    .filter(({ menuId, manualCount }) => manualCount > 0 || getStatsMenu(menuId) !== undefined);

  isSaving.value = true;
  try {
    await window.stats.setManualStats(date.value, menuIdWithManualCountList);
    emit('save');
    model.value = false;
  }
  finally {
    isSaving.value = false;
  }
};

watch(model, (isVisible) => {
  if (isVisible) {
    initialize();
  }
});
watch(date, resetManualCountMap);
</script>

<template>
  <BaseDialog v-model="model">
    <div class="d-flex justify-center align-center ga-6 flex-column">
      <h3 class="text-h5">{{ props.fixedDate === null ? '手動登録' : '手動登録の編集' }}</h3>
      <VTextField
        class="date-input"
        v-model="date"
        type="date"
        label="日付"
        variant="outlined"
        density="compact"
        hide-details
        :max="today"
        :disabled="props.fixedDate !== null"
        :rules="[() => isDateValid]"
      />
      <template v-if="menuList.length <= 0">メニューはありません</template>
      <VTable v-else class="w-100" density="compact">
        <thead>
          <tr>
            <th>メニュー</th>
            <th class="text-right">負け回数分</th>
            <th class="text-right">手動登録</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="menu of menuList" :key="menu.id">
            <td class="text-left">{{ menu.name }}</td>
            <td class="text-right">{{ getStatsMenu(menu.id)?.count ?? 0 }} {{ menuUnitMap[menu.unit] }}</td>
            <td class="manual-count-cell py-1">
              <!-- HACK: rulesを不正値の赤枠表示用に使用 -->
              <VTextField
                v-model.number="manualCountMap[menu.id]"
                type="number"
                min="0"
                step="1"
                variant="outlined"
                single-line
                density="compact"
                hide-details
                :suffix="menuUnitMap[menu.unit]"
                :rules="[() => isManualCountValid(manualCountMap[menu.id] ?? 0)]"
              />
            </td>
          </tr>
        </tbody>
      </VTable>
      <VBtn
        color="green"
        prepend-icon="mdi-content-save"
        :disabled="!canSave"
        :loading="isSaving"
        @click="save"
      >
        保存
      </VBtn>
    </div>
  </BaseDialog>
</template>

<style scoped>
.date-input {
  width: 200px;
}

.manual-count-cell {
  width: 140px;
}
</style>
