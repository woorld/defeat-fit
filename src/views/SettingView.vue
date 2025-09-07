<script setup lang="ts">
// TODO: 画面離脱時の設定変更チェック
// TODO: 設定保存完了時のトースト
// TODO: 設定値の各画面での利用
import { ref, toRaw } from 'vue';
import { SETTING_DEFAULT_VALUE } from '../../common/constants';
import type { Setting } from '../../common/types';
import SettingSlider from '../components/SettingSlider.vue';

const setting = ref<Setting>(SETTING_DEFAULT_VALUE);
const isShowResetDialog = ref(false);

const getSetting = async () => {
  setting.value = await window.setting.getAllSetting();
};

const resetSetting = async () => {
  await window.setting.resetSetting();
  await getSetting();
  isShowResetDialog.value = false;
};

const updateSetting = async () => {
  await window.setting.setAllSetting(toRaw(setting.value));
  getSetting();
};

(() => {
  getSetting();
})();
</script>

<template>
  <VContainer>
    <h2 class="text-h4 text-center mt-6 mb-10">設定</h2>
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
      <div class="d-flex justify-space-around align-center ga-4">
        <VBtn class="flex-1-1-0" color="yellow">
          設定をリセット
          <!-- TODO: 確認ダイアログの共通化 -->
          <VDialog v-model="isShowResetDialog" activator="parent">
            <VSheet class="pa-8 text-center">
              <p>ほんとに設定をリセットする？</p>
              <div class="w-100 mt-8 d-flex justify-center align-center ga-4">
                <VBtn color="yellow" @click="resetSetting">はい</VBtn>
                <VBtn @click="isShowResetDialog = false">いいえ</VBtn>
              </div>
            </VSheet>
            <VBtn
              class="position-absolute top-0 right-0 mt-2 mr-2 elevation-0"
              icon="mdi-close"
              @click="isShowResetDialog = false"
            />
          </VDialog>
        </VBtn>
        <VBtn
          class="flex-1-1-0"
          color="green"
          @click="updateSetting"
        >設定を保存</VBtn>
      </div>
    </div>
  </VContainer>
</template>
