<script setup lang="ts">
import { ref, computed } from 'vue';
import type { Menu } from '@prisma-generated-client';
import { useDefeatCountStore } from '@src/stores/defeat-count';
import { useInstantPresetStore } from '@src/stores/instant-preset';
import DecrementBtn from './components/DecrementBtn.vue';
import OscControlBtn from './components/OscControlBtn.vue';
import DoneBtn from './components/DoneBtn.vue';
import CautionDialog from './components/CautionDialog.vue';
import InstantPresetEditDialog from './components/InstantPresetEditDialog.vue';
import type { MenuIdWithMultiplier, MenuWithMultiplier, PresetWithMenus } from '@common/types';
import ItemEmptyCardWithNav from '@src/components/common/ItemEmptyCardWithNav.vue';
import DoMenuTableRow from './components/DoMenuTableRow.vue';

// NOTE: DBのプリセットIDはオートインクリメント(1~)なので、負の値なら衝突しない
const INSTANT_PRESET_ID = -1;

const defeatCount = useDefeatCountStore();
const instantPreset = useInstantPresetStore();

const presetList = ref<PresetWithMenus[]>([]);
const allMenuList = ref<Menu[]>([]);
const selectedPresetId = ref<number | null>(null);
const isInstantPresetEditDialogVisible = ref(false);

const isInstantPresetSelected = computed(() => selectedPresetId.value === INSTANT_PRESET_ID);

const presetSelect = computed(() => [
  ...presetList.value.map(preset => ({
    title: preset.name,
    value: preset.id,
  })),
  {
    title: '即席プリセット',
    value: INSTANT_PRESET_ID,
  },
]);

const selectedPresetMenuList = computed<MenuWithMultiplier[]>(() => {
  if (isInstantPresetSelected.value) {
    return instantPreset.menuList;
  }

  const preset = presetList.value.find(preset => preset.id === selectedPresetId.value);
  return preset === undefined
    ? []
    : preset.presetMenuList;
});

const selectedPresetMenuIdWithMultiplierList = computed<MenuIdWithMultiplier[]>(() =>
  selectedPresetMenuList.value.map(presetMenu => ({
    menuId: presetMenu.menu.id,
    multiplier: presetMenu.multiplier,
  }))
);

const onSelectPreset = (presetId: number) => {
  // 即席プリセットは一時的なものなので、再起動時に復元する対象にしない
  if (presetId === INSTANT_PRESET_ID) {
    return;
  }
  window.preset.setLastSelectedPresetId(presetId);
}

(async () => {
  [presetList.value, allMenuList.value] = await Promise.all([
    window.preset.getPresetList(),
    window.menu.getMenuList(),
  ]);
  instantPreset.syncMenus(allMenuList.value);

  if (presetList.value.length <= 0) {
    if (allMenuList.value.length >= 1) {
      selectedPresetId.value = INSTANT_PRESET_ID;
    }
    return;
  }

  // 以前選択したプリセットの復元処理（IDがnullのプリセットの存在は考慮しない）
  const lastSelectedPresetId = await window.preset.getLastSelectedPresetId();
  const targetPreset = presetList.value.find(preset => preset.id === lastSelectedPresetId);

  if (targetPreset !== undefined) {
    selectedPresetId.value = lastSelectedPresetId;
    return;
  }

  // 以前選択していたプリセットが存在しない場合、配列の先頭のプリセットを選択・保存
  const headPresetId = presetList.value[0].id;
  selectedPresetId.value = headPresetId;
  window.preset.setLastSelectedPresetId(headPresetId);
})();
</script>

<template>
  <VContainer class="py-2">
    <VRow>
      <VCol cols="4" class=" d-flex flex-column justify-center align-center ga-4">
        <div class="d-flex justify-center align-center">
          <VIcon class="text-h2">mdi-coffin</VIcon>
          <span class="text-h5">×</span>
          <span class="ml-3 text-h3 mb-2 mr-2">{{ defeatCount.count }}</span>
        </div>
        <div class="d-flex align-center ga-4">
          <OscControlBtn />
          <DecrementBtn />
        </div>
      </VCol>
      <VCol cols="8" class="column-right d-flex flex-column ga-8">
        <ItemEmptyCardWithNav
          v-if="presetList.length <= 0 && allMenuList.length <= 0"
          class="my-auto"
          title="プリセットがありません"
          text="負けカウントから筋トレ回数を算出するには、メニューとプリセットが必要です"
          showPresetNav
        />
        <template v-else>
          <div class="w-100 d-flex align-center ga-4 mt-4">
            <VSelect
              v-model="selectedPresetId"
              label="プリセット"
              rounded
              variant="outlined"
              hide-details
              :items="presetSelect"
              @update:model-value="onSelectPreset"
            />
            <VBtn
              v-if="isInstantPresetSelected"
              icon="mdi-pencil"
              variant="tonal"
              @click="isInstantPresetEditDialogVisible = true"
            />
            <DoneBtn :menuIdWithMultiplierList="selectedPresetMenuIdWithMultiplierList" />
          </div>
          <div class="overflow-y-auto flex-grow-1 border rounded">
            <div
              v-if="isInstantPresetSelected && selectedPresetMenuList.length <= 0"
              class="fill-height d-flex flex-column justify-center align-center ga-4"
            >
              <p>今回だけ行うメニューを設定できます</p>
              <VBtn
                prepend-icon="mdi-pencil"
                color="green"
                @click="isInstantPresetEditDialogVisible = true"
              >メニューを設定</VBtn>
            </div>
            <VTable hover v-else-if="selectedPresetId !== null">
              <tbody>
                <DoMenuTableRow v-for="presetMenu of selectedPresetMenuList" :presetMenu />
              </tbody>
            </VTable>
          </div>
        </template>
      </VCol>
    </VRow>
    <CautionDialog />
    <InstantPresetEditDialog v-model="isInstantPresetEditDialogVisible" :allMenuList />
  </VContainer>
</template>

<style scoped>
.column-right {
  /* HACK: BottomNavの高さをべた書き */
  height: calc(100vh - 56px);
}
</style>
