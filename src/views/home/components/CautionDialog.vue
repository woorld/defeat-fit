<script setup lang="ts">
import { ref } from 'vue';
import BaseDialog from '@src/components/common/BaseDialog.vue';

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
    <div class="d-flex flex-column justify-center align-center ga-8">
      <h3 class="text-h5">ご注意</h3>
      <div class="d-flex justify-center align-start ga-4">
        <section class="w-100 h-100">
          <h4 class="text-h6 mb-4">無理せずやろう！</h4>
          <div class="text-left">
            <p>負けによる筋トレは<em class="bg-yellow rounded mx-1 px-1">義務ではありません</em>。</p>
            <p>本来楽しむべき対戦を、筋トレが嫌でやめてしまっては本末転倒です。</p>
            <p><em class="bg-yellow rounded mr-1 px-1">気負わず無理せず</em>やりましょう！</p>
          </div>
        </section>
        <VDivider vertical />
        <section class="w-100 h-100">
          <h4 class="text-h6 mb-4">首をいたわろう！</h4>
          <div class="text-left">
            <p>HMDを付けた状態で行う筋トレは、<em class="bg-yellow rounded mx-1 px-1">首への負担が増加します</em>。</p>
            <p>首を労わったメニュー調整を行いましょう！</p>
          </div>
        </section>
      </div>
      <div>
        <VCheckbox
          v-model="dontShowAgain"
          label="次回以降表示しない"
          hide-details
        />
        <VBtn color="green" @click="isVisible = false">わかった</VBtn>
      </div>
    </div>
  </BaseDialog>
</template>
