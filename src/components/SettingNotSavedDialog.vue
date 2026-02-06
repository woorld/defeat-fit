<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter, onBeforeRouteLeave } from 'vue-router';
import { toRaw } from 'vue';
import type { TargetOscMessageSetting, Setting } from '../../common/types';
import ConfirmDialog from './ConfirmDialog.vue';

const router = useRouter();
let nextPagePath = '';

const props = defineProps<{
  setting: Setting,
  prevSetting: Setting,
}>();

const emit = defineEmits<{
  (e: 'save-setting'): void,
  (e: 'discard-changed-setting'): void,
}>();

const isShow = ref(false);

const isSettingChanged = computed(() => {
  const sortById = <T extends TargetOscMessageSetting>(a: T, b: T) => a.id - b.id;
  const sortedOscSetting = toRaw(props.setting.targetOscMessage).toSorted(sortById);
  const sortedPrevOscSetting = toRaw(props.prevSetting.targetOscMessage).toSorted(sortById);

  if (sortedOscSetting.length !== sortedPrevOscSetting.length) {
    return true;
  }

  if (sortedOscSetting.some((setting, index) => (
    setting.address !== sortedPrevOscSetting[index].address ||
    setting.enabled !== sortedPrevOscSetting[index].enabled)
  )) {
    return true;
  }

  const settingProps = (
    Object.keys(props.setting).filter(key => key !== 'targetOscMessage')
  ) as (keyof Omit<Setting, 'targetOscMessage'>)[]; // setting: Settingなので型アサーションして問題ない

  return settingProps.some(name => props.setting[name] !== props.prevSetting[name]);
});

const leavePage = async (isSaveSetting: boolean) => {
  // emit内の文字列を三項演算子で出し分けたいがエラーになる
  isSaveSetting
    ? emit('save-setting')
    : emit('discard-changed-setting');
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
