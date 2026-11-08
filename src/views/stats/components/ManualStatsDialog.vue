<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { VDateInput } from 'vuetify/labs/VDateInput';
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
const selectedMenuIdList = ref<Menu['id'][]>([]);
const manualCountMap = ref<Partial<Record<Menu['id'], number>>>({});
const isSaving = ref(false);
const isInitialized = ref(false);

// NOTE: new Date('YYYY-MM-DD')はUTC扱いになり日付がずれるため、ローカル時刻として生成する
const toLocalDate = (dateString: string) => {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
};

// VDateInputはDateを扱うため、統計の日付形式(YYYY-MM-DD)と相互変換する
const dateModel = computed({
  get: () => date.value === '' ? null : toLocalDate(date.value),
  set: (value: Date | null) => {
    date.value = value === null ? '' : value.toLocaleDateString('sv-SE');
  },
});
const maxDate = computed(() => today.value === '' ? undefined : toLocalDate(today.value));

const targetStats = computed(() => props.statsList.find(stats => stats.date === date.value));
const selectedMenuList = computed(() => menuList.value.filter(menu => selectedMenuIdList.value.includes(menu.id)));
const isDateValid = computed(() => /^\d{4}-\d{2}-\d{2}$/.test(date.value) && date.value <= today.value);
// NOTE: 0回の登録は意味を持たないため1以上を必須とする（取り消しはメニューの選択解除で行う）
const isManualCountValid = (manualCount: number | undefined) =>
  manualCount !== undefined && Number.isInteger(manualCount) && manualCount >= 1;
const canSave = computed(() =>
  isDateValid.value
  // 既存の手動登録をすべて取り消す場合は、メニュー未選択でも保存できる必要がある
  && (selectedMenuList.value.length >= 1 || getRegisteredMenuIdList().length >= 1)
  && selectedMenuList.value.every(menu => isManualCountValid(manualCountMap.value[menu.id]))
);

const getStatsMenu = (menuId: Menu['id']) =>
  targetStats.value?.statsMenuList.find(statsMenu => statsMenu.menuId === menuId);

const getRegisteredMenuIdList = () =>
  (targetStats.value?.statsMenuList ?? [])
    .filter(statsMenu => statsMenu.manualCount > 0)
    .map(statsMenu => statsMenu.menuId);

const resetManualCount = () => {
  selectedMenuIdList.value = getRegisteredMenuIdList();
  manualCountMap.value = Object.fromEntries(
    getRegisteredMenuIdList().map(menuId => [menuId, getStatsMenu(menuId)?.manualCount])
  );
};

const deselectMenu = (menuId: Menu['id']) => {
  selectedMenuIdList.value = selectedMenuIdList.value.filter(selectedMenuId => selectedMenuId !== menuId);
};

const initialize = async () => {
  const [fetchedMenuList, dayBoundaryOffsetHours] = await Promise.all([
    window.menu.getMenuList(),
    window.setting.getSetting('dayBoundaryOffsetHours'),
  ]);

  menuList.value = fetchedMenuList;
  today.value = getStatsDateString(new Date(), dayBoundaryOffsetHours);
  date.value = props.fixedDate ?? today.value;
  resetManualCount();
  isInitialized.value = true;
};

const save = async () => {
  if (!canSave.value) {
    return;
  }

  const selectedMenuIdWithManualCountList: MenuIdWithManualCount[] = selectedMenuList.value
    .map(menu => ({ menuId: menu.id, manualCount: manualCountMap.value[menu.id] ?? 0 }));
  // 選択を外したメニューは、既存の手動登録を取り消すため0で送る
  const deselectedMenuIdWithManualCountList: MenuIdWithManualCount[] = getRegisteredMenuIdList()
    .filter(menuId => !selectedMenuIdList.value.includes(menuId))
    .map(menuId => ({ menuId, manualCount: 0 }));

  isSaving.value = true;
  try {
    await window.stats.setManualStats(date.value, [
      ...selectedMenuIdWithManualCountList,
      ...deselectedMenuIdWithManualCountList,
    ]);
    emit('save');
    model.value = false;
  }
  finally {
    isSaving.value = false;
  }
};

watch(model, (isVisible) => {
  if (isVisible) {
    // 前回開いたときの入力内容が、初期化完了まで表示されないようにする
    isInitialized.value = false;
    initialize();
  }
});
watch(date, resetManualCount);
</script>

<template>
  <BaseDialog v-model="model">
    <div class="d-flex justify-center align-center ga-6 flex-column">
      <h3 class="text-h5">{{ props.fixedDate === null ? '手動登録' : '手動登録の編集' }}</h3>
      <VProgressCircular v-if="!isInitialized" indeterminate />
      <template v-else>
        <div class="d-flex justify-center align-center ga-4">
          <VDateInput
            class="date-input"
            v-model="dateModel"
            input-format="yyyy-mm-dd"
            variant="outlined"
            density="compact"
            prepend-icon=""
            prepend-inner-icon="$calendar"
            hide-details
            :max="maxDate"
            :disabled="props.fixedDate !== null"
            :rules="[() => isDateValid]"
          />
          <VMenu :close-on-content-click="false">
            <template #activator="{ props: activatorProps }">
              <VBtn
                v-bind="activatorProps"
                rounded
                prepend-icon="mdi-plus"
                :disabled="menuList.length <= 0"
              >メニューを追加</VBtn>
            </template>
            <VList
              v-model:selected="selectedMenuIdList"
              select-strategy="leaf"
              density="compact"
            >
              <VListItem
                v-for="menu of menuList"
                :key="menu.id"
                :title="menu.name"
                :value="menu.id"
              >
                <!-- NOTE: VListItemはクリック対象がinput要素だと選択処理をしないため、チェックボックス側からも選択させる -->
                <template #prepend="{ isSelected, select }">
                  <VCheckboxBtn :model-value="isSelected" @update:model-value="select" />
                </template>
              </VListItem>
            </VList>
          </VMenu>
        </div>
        <template v-if="menuList.length <= 0">メニューはありません</template>
        <template v-else-if="selectedMenuList.length <= 0">メニューを追加してください</template>
        <VTable v-else class="w-100" density="compact">
          <thead>
            <tr>
              <th>メニュー</th>
              <th class="text-right">負け回数分</th>
              <th class="text-right">手動登録分</th>
              <th />
            </tr>
          </thead>
          <tbody>
            <tr v-for="menu of selectedMenuList" :key="menu.id">
              <td class="text-left">{{ menu.name }}</td>
              <td class="text-right">{{ getStatsMenu(menu.id)?.count ?? 0 }} {{ menuUnitMap[menu.unit] }}</td>
              <td class="manual-count-cell py-1">
                <!-- HACK: rulesを不正値の赤枠表示用に使用 -->
                <VTextField
                  v-model.number="manualCountMap[menu.id]"
                  type="number"
                  min="1"
                  step="1"
                  variant="outlined"
                  single-line
                  density="compact"
                  hide-details
                  :suffix="menuUnitMap[menu.unit]"
                  :rules="[() => isManualCountValid(manualCountMap[menu.id])]"
                />
              </td>
              <td class="text-right px-2">
                <VBtn
                  class="text-red"
                  size="small"
                  elevation="0"
                  icon="mdi-trash-can"
                  @click="deselectMenu(menu.id)"
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
      </template>
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
