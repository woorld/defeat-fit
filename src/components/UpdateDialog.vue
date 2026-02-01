<script setup lang="ts">
import { onMounted, ref } from 'vue';
import BaseDialog from './BaseDialog.vue';

const model = defineModel<boolean>({ required: true });
const downloadStatus = ref<'STANDBY' | 'PROGRESS' | 'COMPLETE' | 'ERROR'>('STANDBY');
const downloadProgressPercent = ref(0);

const downloadUpdate = () => {
  window.update.onReceiveDownloadProgress((progress: number) => {
    downloadProgressPercent.value = progress;
  });
  window.update.onUpdateDownloaded(() => {
    downloadStatus.value = 'COMPLETE';
  });
  window.update.onErrorWhileUpdate(() => {
    downloadStatus.value = 'ERROR';
  });

  window.update.downloadUpdate();
  downloadStatus.value = 'PROGRESS';
};

const relaunchApp = () => {
  window.update.relaunchApp();
}

onMounted(async () => {
  model.value = await window.update.isUpdateAvailable();
});
</script>

<template>
  <!-- FIXME: ダイアログ表示中にOSCボタンのツールチップが触れる -->
  <BaseDialog v-model="model" :canClose="downloadStatus !== 'PROGRESS'">
    <template v-if="downloadStatus === 'STANDBY'">
      <p>最新のアップデートが見つかりました。ダウンロードしますか？</p>
      <!-- TODO: コンポーネント化 -->
      <div class="w-100 mt-8 d-flex justify-center align-center ga-4">
        <VBtn variant="outlined" @click="model = false">いいえ</VBtn>
        <VBtn color="green" @click="downloadUpdate">はい</VBtn>
      </div>
    </template>
    <template v-else-if="downloadStatus === 'PROGRESS'">
      <p class="mb-4">アップデートに必要なファイルをダウンロードしています…</p>
      <VProgressLinear v-model="downloadProgressPercent" rounded height="8" />
    </template>
    <template v-else-if="downloadStatus === 'COMPLETE'">
      <p>必要なファイルのダウンロードが完了しました。</p>
      <p>アップデートを適用するには再起動してください。</p>
      <!-- TODO: コンポーネント化 -->
      <div class="w-100 mt-8 d-flex justify-center align-center ga-4">
        <VBtn variant="outlined" @click="model = false">あとで再起動する</VBtn>
        <VBtn color="green" @click="relaunchApp">再起動</VBtn>
      </div>
    </template>
    <template v-else-if="downloadStatus === 'ERROR'"></template>
  </BaseDialog>
</template>
