<script setup lang="ts">
import { ref, computed } from 'vue';
import { useDefeatCountStore } from '../stores/defeat-count';
import DecrementBtn from '../components/DecrementBtn.vue';
import OscControlBtn from '../components/OscControlBtn.vue';
import DoMenuBtn from '../components/DoMenuBtn.vue';
import DoneBtn from '../components/DoneBtn.vue';
import CautionDialog from '../components/CautionDialog.vue';
import { menuUnitMap } from '../../common/util';
import { MenuIdWithMultiplier, PresetWithMenus } from '../../common/types';
import ItemEmptyCardWithNav from '../components/ItemEmptyCardWithNav.vue';

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
  window.setting.setSetting('lastSelectedPresetId', presetId);
}

(async () => {
  presetList.value = await window.preset.getPresetList();
  if (presetList.value.length <= 0) {
    return;
  }

  // 以前選択したプリセットの復元処理（IDがnullのプリセットの存在は考慮しない）
  const lastSelectedPresetId = await window.setting.getSetting('lastSelectedPresetId');
  const targetPreset = presetList.value.find(preset => preset.id === lastSelectedPresetId);

  if (targetPreset !== undefined) {
    selectedPresetId.value = lastSelectedPresetId;
    return;
  }

  // 以前選択していたプリセットが存在しない場合、配列の先頭のプリセットを選択・保存
  const headPresetId = presetList.value[0].id;
  selectedPresetId.value = headPresetId;
  window.setting.setSetting('lastSelectedPresetId', headPresetId);
})();
</script>

<template>
  <VContainer>
    <div class="d-flex justify-center align-center mt-8 mb-13">
      <VIcon class="text-h2">mdi-coffin</VIcon>
      <span class="text-h5">×</span>
      <span class="ml-3 text-h3 mb-2">{{ defeatCount.count }}</span>
    </div>
    <ItemEmptyCardWithNav
      v-if="presetList.length <= 0"
      title="プリセットがありません"
      text="負けカウントから筋トレ回数を算出するには、メニューとプリセットが必要です"
      showPresetNav
    />
    <template v-else>
      <VSelect
        v-model="selectedPresetId"
        class="mb-6"
        label="プリセット"
        rounded
        variant="outlined"
        hide-details
        :items="presetSelect"
        @update:model-value="onSelectPreset"
      />
      <VTable hover v-if="selectedPresetId !== null">
        <tbody>
          <tr v-for="presetMenu of selectedPresetMenuList">
            <td>{{ presetMenu.menu.name }}</td>
            <td>× {{ presetMenu.multiplier }} {{ menuUnitMap[presetMenu.menu.unit] }}</td>
            <td class="text-right">
              <span
                class="pt-1 pb-1 pr-2 pl-2 rounded"
              >{{ Math.ceil(presetMenu.multiplier * defeatCount.count) }} {{ menuUnitMap[presetMenu.menu.unit] }}</span>
            </td>
            <td class="text-right">
              <DoMenuBtn :presetMenuWithMenu="presetMenu" />
            </td>
          </tr>
        </tbody>
      </VTable>
      <div class="w-100 mt-8 d-flex justify-center align-center ga-4">
        <DecrementBtn class="flex-1-1-0" />
        <DoneBtn class="flex-1-1-0" :menuIdWithMultiplierList="selectedPresetMenuIdWithMultiplierList" />
      </div>
    </template>
    <OscControlBtn />
    <CautionDialog />
  </VContainer>
</template>
