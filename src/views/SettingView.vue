<script setup lang="ts">
import { ref, toRaw } from 'vue';
import { SETTING_DEFAULT_VALUE } from '../../common/constants';
import type { Setting } from '../../common/types';
import SettingSlider from '../components/SettingSlider.vue';
import SettingNotSavedDialog from '../components/SettingNotSavedDialog.vue';
import ConfirmDialog from '../components/ConfirmDialog.vue';
import ViewHeading from '../components/ViewHeading.vue';

const setting = ref<Setting>({ ...SETTING_DEFAULT_VALUE });
const prevSetting = ref<Setting>({ ...SETTING_DEFAULT_VALUE });
const isShowResetDialog = ref(false);
const isShowSavedSnackbar = ref(false);
const snackbarLifetime = ref(2500);

const getSetting = async () => {
  const fetchedSetting = await window.setting.getAllSetting();
  setting.value = { ...fetchedSetting };
  prevSetting.value = { ...fetchedSetting };
};

const resetSetting = async () => {
  await window.setting.resetSetting();
  await getSetting();
  isShowResetDialog.value = false;
};

const saveSetting = async () => {
  await window.setting.setAllSetting(toRaw(setting.value));
  getSetting();
};

getSetting();
</script>

<template>
  <VContainer>
    <ViewHeading title="設定" />
    <div class="d-flex flex-column ga-10">
      <VTextField
        label="対象のOSCメッセージ"
        v-model="setting.targetOscMessage"
        hide-details
      />
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
            v-model="isShowResetDialog"
            explanation="ほんとに設定をリセットする？"
            yesBtnColor="yellow"
            reverseYesNoPosition
            activateByParent
            @click-yes="resetSetting"
            @click-no="isShowResetDialog = false"
          />
        </VBtn>
        <VBtn
          class="flex-1-1-0"
          color="green"
          @click="saveSetting"
        >設定を保存</VBtn>
      </div>
    </div>
    <VSnackbar
      v-model="isShowSavedSnackbar"
      color="green"
      location="bottom left"
      :timeout="snackbarLifetime"
    >
      設定を保存しました
      <template #actions>
        <VBtn icon="mdi-close" @click="isShowSavedSnackbar = false" />
      </template>
    </VSnackbar>
    <SettingNotSavedDialog
      :setting="setting"
      :prevSetting="prevSetting"
      @update-setting="prevSetting = setting"
      @discard-changed-setting="setting = prevSetting"
    />
  </VContainer>
</template>
