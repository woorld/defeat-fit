<script setup lang="ts">
import { ref, computed } from 'vue';
import { useDefeatCountStore } from '@src/stores/defeat-count';
import DecrementBtn from './components/DecrementBtn.vue';
import OscControlBtn from './components/OscControlBtn.vue';
import DoneBtn from './components/DoneBtn.vue';
import CautionDialog from './components/CautionDialog.vue';
import type { MenuIdWithMultiplier, PresetWithMenus } from '@common/types';
import ItemEmptyCardWithNav from '@src/components/common/ItemEmptyCardWithNav.vue';
import DoMenuTableRow from './components/DoMenuTableRow.vue';

const defeatCount = useDefeatCountStore();

const presetList = ref<PresetWithMenus[]>([]);
const selectedPresetId = ref<number | null>(null);

const presetSelect = computed(() => presetList.value.map(preset => ({
  title: preset.name,
  value: preset.id,
})));

const selectedPresetMenuList = computed(() => {
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
  window.preset.setLastSelectedPresetId(presetId);
}

(async () => {
  presetList.value = await window.preset.getPresetList();
  if (presetList.value.length <= 0) {
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
          v-if="presetList.length <= 0"
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
            <DoneBtn :menuIdWithMultiplierList="selectedPresetMenuIdWithMultiplierList" />
          </div>
          <div class="overflow-y-auto flex-grow-1 border rounded">
            <VTable hover v-if="selectedPresetId !== null">
              <tbody>
                <DoMenuTableRow v-for="presetMenu of selectedPresetMenuList" :presetMenu />
              </tbody>
            </VTable>
          </div>
        </template>
      </VCol>
    </VRow>
    <CautionDialog />
  </VContainer>
</template>

<style scoped>
.column-right {
  /* HACK: BottomNavの高さをべた書き */
  height: calc(100vh - 56px);
}
</style>
