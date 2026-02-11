<script setup lang="ts">
import { computed, ref, toRaw } from 'vue';
import { SETTING_DEFAULT_VALUE } from '../../common/constants';
import type { Setting, TargetOscMessageSetting } from '../../common/types';
import SettingSlider from '../components/SettingSlider.vue';
import ConfirmDialog from '../components/ConfirmDialog.vue';
import ViewHeading from '../components/ViewHeading.vue';
import { useOscStore } from '../stores/osc';
import { onBeforeRouteLeave, useRouter } from 'vue-router';
import ColorThemeSelect from '../components/ColorThemeSelect.vue';
import { useTheme } from 'vuetify';
import TargetOscMessageList from '../components/TargetOscMessageList.vue';
import OscReceivedSoundSelect from '../components/OscReceivedSoundSelect.vue';

let nextPagePath = '';
const router = useRouter();
const oscStore = useOscStore();
const theme = useTheme();
const oscStatusWhenEnter = oscStore.oscStatus;

const setting = ref<Setting>({ ...SETTING_DEFAULT_VALUE });
const prevSetting = ref<Setting>({ ...SETTING_DEFAULT_VALUE });
const isResetDialogVisible = ref(false);
const isNotSavedDialogVisible = ref(false);

const isSettingChanged = computed(() => {
  const sortById = <T extends TargetOscMessageSetting>(a: T, b: T) => a.id - b.id;
  const sortedOscSetting = toRaw(setting.value.targetOscMessage).toSorted(sortById);
  const sortedPrevOscSetting = toRaw(prevSetting.value.targetOscMessage).toSorted(sortById);

  if (sortedOscSetting.length !== sortedPrevOscSetting.length) {
    return true;
  }

  if (
    sortedOscSetting.some((setting, index) =>
      setting.address !== sortedPrevOscSetting[index].address ||
      setting.enabled !== sortedPrevOscSetting[index].enabled
    )
  ) {
    return true;
  }

  const settingProps = (
    Object.keys(setting.value).filter(key => key !== 'targetOscMessage')
  ) as (keyof Omit<Setting, 'targetOscMessage'>)[]; // setting: Settingなので型アサーションして問題ない

  return settingProps.some(name => setting.value[name] !== prevSetting.value[name]);
});

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

const leavePage = async (isSaveSetting: boolean) => {
  if (isSaveSetting) {
    await saveSetting(true);
  }
  else {
    setting.value = prevSetting.value;
  }

  isNotSavedDialogVisible.value = false;
  router.push(nextPagePath);
};

// 設定中はOSCサーバーがリッスンするメッセージと設定内容に差が生じる可能性があるため、サーバーを停止
window.osc.stopListening();
getSetting();

onBeforeRouteLeave(async (to) => {
  if (isSettingChanged.value) {
    isNotSavedDialogVisible.value = true;
    nextPagePath = to.path;
    return false;
  }

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
      <OscReceivedSoundSelect v-model="setting.oscReceivedSound" />
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
    <ConfirmDialog
      v-model="isNotSavedDialogVisible"
      explanation="変更された設定を保存しますか？"
      yesBtnColor="green"
      @click-yes="leavePage(true)"
      @click-no="leavePage(false)"
    />
  </VContainer>
</template>
