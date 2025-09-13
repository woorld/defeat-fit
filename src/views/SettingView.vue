<script setup lang="ts">
import { ref, toRaw } from 'vue';
import { SETTING_DEFAULT_VALUE } from '../../common/constants';
import type { Setting } from '../../common/types';
import SettingSlider from '../components/SettingSlider.vue';
import { onBeforeRouteLeave } from 'vue-router';
import { useRouter } from 'vue-router';

const router = useRouter();
let prevSetting: Setting = { ...SETTING_DEFAULT_VALUE };
let nextPagePathWhenNotSaved = ''; // TODO: なんとかしたい

const setting = ref<Setting>({ ...SETTING_DEFAULT_VALUE });
const isShowResetDialog = ref(false);
const isShowNotSavedDialog = ref(false);
const isShowSavedSnackbar = ref(false);
const snackbarLifetime = ref(2500);

const getSetting = async () => {
  const fetchedSetting = await window.setting.getAllSetting();
  setting.value = { ...fetchedSetting };
  prevSetting = { ...fetchedSetting };
};

const resetSetting = async () => {
  await window.setting.resetSetting();
  await getSetting();
  isShowResetDialog.value = false;
};

const saveSetting = async () => {
  await window.setting.setAllSetting(toRaw(setting.value));
  if (await window.osc.getListeningStatus()) {
    // OSCサーバを開きなおさないと変更が反映されない
    // TODO: どっかで状態がずれたら破綻するのでなんとかしたい
    await window.osc.toggleListening();
    await window.osc.toggleListening();

    isShowSavedSnackbar.value = true;
  }
  await getSetting();
};

const leavePageWithDialog = async (isSaveSetting: boolean) => {
  if (isSaveSetting) {
    await saveSetting();
  }
  else {
    // NOTE: そのまま遷移しようとすると再度onBeforeRouteLeaveの処理に引っかかる
    setting.value = { ...prevSetting };
  }

  isShowNotSavedDialog.value = false;
  router.push(nextPagePathWhenNotSaved);
};

getSetting();

onBeforeRouteLeave((to) => {
  // 設定が変更されており、かつ保存していない場合
  const isChanged = Object.keys(setting.value).some(name => setting.value[name as keyof Setting] !== prevSetting[name as keyof Setting]);
  if (isChanged) {
    isShowNotSavedDialog.value = true;
    nextPagePathWhenNotSaved = to.path;
    return false;
  }
});
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
    <VDialog v-model="isShowNotSavedDialog">
      <VSheet class="pa-8 text-center">
        <p>変更された設定があるけどどうする？</p>
        <div class="w-100 mt-8 d-flex justify-center align-center ga-4">
          <VBtn color="red" @click="leavePageWithDialog(false)">破棄して移動</VBtn>
          <VBtn color="green" @click="leavePageWithDialog(true)">保存して移動</VBtn>
        </div>
      </VSheet>
      <VBtn
        class="position-absolute top-0 right-0 mt-2 mr-2 elevation-0"
        icon="mdi-close"
        @click="isShowNotSavedDialog = false"
      />
    </VDialog>
  </VContainer>
</template>
