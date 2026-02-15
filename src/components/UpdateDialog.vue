<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import BaseDialog from '@src/components/BaseDialog.vue';
import CopiableCodeArea from '@src/components/CopiableCodeArea.vue';

const model = defineModel<boolean>({ required: true });

const downloadStatus = ref<'STANDBY' | 'PROGRESS' | 'COMPLETE' | 'ERROR'>('STANDBY');
const downloadProgressPercent = ref(0);
const downloadError = ref<Error | null>(null);

const downloadErrorMessage = computed(() =>
  downloadError.value === null
    ? 'downloadError is null'
    : [
      `name: ${downloadError.value.name}`,
      `message: ${downloadError.value.message}`,
      `cause: ${downloadError.value.cause}`,
      `stack: ${downloadError.value.stack}`,
    ].join('\n')
);

const downloadUpdate = () => {
  window.update.onReceiveDownloadProgress((progress: number) => {
    downloadProgressPercent.value = progress;
  });
  window.update.onUpdateDownloaded(() => {
    downloadStatus.value = 'COMPLETE';
  });
  window.update.onErrorWhileUpdate((error) => {
    downloadError.value = error;
    downloadStatus.value = 'ERROR';
  });

  window.update.downloadUpdate();
  downloadStatus.value = 'PROGRESS';
};

const relaunchApp = () => {
  window.update.relaunchApp();
};

onMounted(async () => {
  model.value = await window.update.isUpdateAvailable();
});
</script>

<template>
  <BaseDialog v-model="model" :canClose="downloadStatus !== 'PROGRESS'">
    <template v-if="downloadStatus === 'STANDBY'">
      <p>最新のアップデートが見つかりました。ダウンロードしますか？</p>
      <div class="w-100 mt-8 d-flex justify-center align-center ga-4">
        <VBtn variant="outlined" @click="model = false">いいえ</VBtn>
        <VBtn color="green" @click="downloadUpdate">はい</VBtn>
      </div>
    </template>
    <template v-else-if="downloadStatus === 'PROGRESS'">
      <p class="mb-4">アップデートに必要なファイルをダウンロードしています…</p>
      <VProgressLinear
        v-model="downloadProgressPercent"
        rounded
        height="8"
      />
    </template>
    <template v-else-if="downloadStatus === 'COMPLETE'">
      <p>必要なファイルのダウンロードが完了しました。</p>
      <p>アップデートを適用するには、アプリを再起動してください。</p>
      <div class="w-100 mt-8 d-flex justify-center align-center ga-4">
        <VBtn variant="outlined" @click="model = false">あとで再起動する</VBtn>
        <VBtn color="green" @click="relaunchApp">再起動</VBtn>
      </div>
    </template>
    <div v-else-if="downloadStatus === 'ERROR'" class="d-flex justify-center align-center flex-column ga-6">
      <div>
        <p>エラーが発生しました。</p>
        <p>問題が解決しない場合は、以下のコードを開発者にご連絡ください。</p>
      </div>
      <CopiableCodeArea :code="downloadErrorMessage" />
      <VBtn variant="outlined" @click="model = false">閉じる</VBtn>
    </div>
  </BaseDialog>
</template>
