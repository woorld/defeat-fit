<script setup lang="ts">
import { ref, toRaw } from 'vue';
import { SETTING_DEFAULT_VALUE } from '../../common/constants';
import type { Setting } from '../../common/types';
import SettingSlider from '../components/SettingSlider.vue';
import SettingNotSavedDialog from '../components/SettingNotSavedDialog.vue';
import ConfirmDialog from '../components/ConfirmDialog.vue';
import ViewHeading from '../components/ViewHeading.vue';
import { useOscStore } from '../stores/osc';
import { onBeforeRouteLeave } from 'vue-router';
import ColorThemeSelect from '../components/ColorThemeSelect.vue';
import { useTheme } from 'vuetify';
import TargetOscMessageList from '../components/TargetOscMessageList.vue';

const oscStore = useOscStore();
const theme = useTheme();
const oscStatusWhenEnter = oscStore.oscStatus;

const setting = ref<Setting>({ ...SETTING_DEFAULT_VALUE });
const prevSetting = ref<Setting>({ ...SETTING_DEFAULT_VALUE });
const isResetDialogVisible = ref(false);

const getSetting = async () => {
  const fetchedSetting = await window.setting.getAllSetting();
  setting.value = structuredClone(fetchedSetting);
  prevSetting.value = structuredClone(fetchedSetting);
};

const resetSetting = async () => {
  await window.setting.resetSetting();
  await getSetting();
  isResetDialogVisible.value = false;
};

const saveSetting = async (byNotSavedDialog = false) => {
  if (byNotSavedDialog) {
    prevSetting.value = structuredClone(toRaw(setting.value)) // 旧設定を新しいものに更新し、ダイアログの再表示を防止
  }

  await window.setting.setAllSetting(toRaw(setting.value));

  if (setting.value.colorTheme === 'system') {
    const isOsDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    theme.change(isOsDarkMode ? 'dark' : 'light');
  }
  else {
    theme.change(setting.value.colorTheme);
  }

  getSetting();
};

getSetting();

onBeforeRouteLeave(async () => {
  if (oscStore.oscStatus === 'OPEN_ALL') {
    await window.osc.stopListening();
  }

  // 画面突入時にOSCがオンだった場合は起動しなおす
  if (oscStore.oscStatus === 'CLOSE' && oscStatusWhenEnter === 'OPEN') {
    window.osc.startListening();
  }
});
</script>

<template>
  <VContainer>
    <ViewHeading title="設定" />
    <div class="d-flex flex-column ga-10">
      <ColorThemeSelect v-model="setting.colorTheme" />
      <TargetOscMessageList v-model="setting.targetOscMessage" />
      <SettingSlider
        setting-name="soundVolume"
        label="SE音量"
        v-model="setting.soundVolume"
        :step="0.01"
        :min="0"
        :max="1"
      />
      <SettingSlider
        setting-name="breakTimeSecBetweenSets"
        label="セット間の休憩時間（秒）"
        v-model="setting.breakTimeSecBetweenSets"
        :step="1"
        :min="1"
        :max="300"
      />
      <div class="d-flex justify-space-between align-center">
        <VLabel>ホーム画面に注意喚起ダイアログを表示する</VLabel>
        <VSwitch
          v-model="setting.showCautionDialog"
          inset
          color="green"
          hide-details
        />
      </div>
      <SettingSlider
        setting-name="dayBoundaryOffsetHours"
        label="統計の保存時、翌日何時までを本日とするか"
        v-model="setting.dayBoundaryOffsetHours"
        :step="1"
        :min="0"
        :max="9"
      />
      <div class="d-flex justify-space-around align-center ga-4">
        <VBtn class="flex-1-1-0" color="yellow">
          設定をリセット
          <ConfirmDialog
            v-model="isResetDialogVisible"
            explanation="本当に設定をリセットしますか？"
            yesBtnColor="yellow"
            reverseYesNoPosition
            activateByParent
            @click-yes="resetSetting"
            @click-no="isResetDialogVisible = false"
          />
        </VBtn>
        <VBtn
          class="flex-1-1-0"
          color="green"
          @click="saveSetting"
        >設定を保存</VBtn>
      </div>
    </div>
    <SettingNotSavedDialog
      :setting="setting"
      :prevSetting="prevSetting"
      @save-setting="saveSetting(true)"
      @discard-changed-setting="setting = prevSetting"
    />
  </VContainer>
</template>
