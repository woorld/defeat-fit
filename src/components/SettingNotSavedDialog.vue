<script setup lang="ts">
import { ref, computed, toRaw } from 'vue';
import { useRouter, onBeforeRouteLeave } from 'vue-router';
import type { Setting } from '../../common/types';
import ConfirmDialog from './ConfirmDialog.vue';

const router = useRouter();
let nextPagePath = '';

const props = defineProps<{
  setting: Setting,
  prevSetting: Setting,
}>();

const emit = defineEmits<{
  (e: 'update-setting'): void,
  (e: 'discard-changed-setting'): void,
}>();

const isShow = ref(false);

const isSettingChanged = computed(() => {
  const settingProps = Object.keys(props.setting) as [keyof Setting]; // setting: Settingなので型アサーションして問題ない
  return settingProps.some(name => props.setting[name] !== props.prevSetting[name]);
});

const leavePage = async (isSaveSetting: boolean) => {
  if (isSaveSetting) {
    await window.setting.setAllSetting(toRaw(props.setting));
    emit('update-setting'); // 親コンポーネントで持っている旧設定を新しいものに更新し、ダイアログ表示を防止
  }
  else {
    emit('discard-changed-setting');
  }
  isShow.value = false;
  router.push(nextPagePath);
};

onBeforeRouteLeave((to) => {
  if (isSettingChanged.value) {
    isShow.value = true;
    nextPagePath = to.path;
    return false;
  }
});
</script>

<template>
  <ConfirmDialog
    v-model="isShow"
    explanation="変更された設定を保存しますか？"
    yesBtnColor="green"
    @click-yes="leavePage(true)"
    @click-no="leavePage(false)"
  />
</template>
