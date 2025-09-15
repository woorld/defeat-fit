<script setup lang="ts">
import { ref, computed, toRaw } from 'vue';
import { useRouter, onBeforeRouteLeave } from 'vue-router';
import type { Setting } from '../../common/types';

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
  <!-- TODO: ダイアログの共通化 -->
  <VDialog v-model="isShow">
    <VSheet class="pa-8 text-center">
      <p>変更された設定があるけどどうする？</p>
      <div class="w-100 mt-8 d-flex justify-center align-center ga-4">
        <VBtn variant="outlined" @click="leavePage(false)">破棄して移動</VBtn>
        <VBtn color="green" @click="leavePage(true)">保存して移動</VBtn>
      </div>
    </VSheet>
    <VBtn
      class="position-absolute top-0 right-0 mt-2 mr-2 elevation-0"
      icon="mdi-close"
      @click="isShow = false"
    />
  </VDialog>
</template>
