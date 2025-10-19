<script setup lang="ts">
import { ref } from 'vue';
import BaseDialog from './BaseDialog.vue';

const isVisible = ref(false);
const dontShowAgain = ref(false);

const saveDialogSetting = () => {
  if (dontShowAgain.value) {
    window.setting.setSetting('showCautionDialog', false);
  }
};

(async () => {
  const showCautionDialog = await window.setting.getSetting('showCautionDialog');
  isVisible.value = showCautionDialog;
})();
</script>

<template>
  <BaseDialog v-model="isVisible" @close="saveDialogSetting">
    <h3 class="text-h5 mb-6 text-yellow">戦いやめるな！筋トレやめろ！</h3>
    <div class="d-flex justify-center align-center flex-column ga-4">
      <div class="text-left">
        <p>負けによる筋トレは<em class="bg-yellow rounded mx-1 px-1">義務ではありません</em>。</p>
        <p>本来楽しむべき対戦を、筋トレが嫌でやめてしまっては本末転倒です。</p>
        <p><em class="bg-yellow rounded mr-1 px-1">気負わず無理せず</em>やりましょう！</p>
      </div>
      <VCheckbox
        class="text-center"
        v-model="dontShowAgain"
        label="次回以降表示しない"
        hide-details
      />
    </div>
  </BaseDialog>
</template>
