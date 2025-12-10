<script setup lang="ts">
import { computed, ref } from 'vue';
import BaseDialog from './BaseDialog.vue';
import { useOscStore } from '../stores/osc';
import { VList } from 'vuetify/components';

const oscStore = useOscStore();

const emit = defineEmits<{
  (e: 'select-message', message: string): void,
}>();

const isVisible = ref(false);

const listenedOscMessagesByNewest = computed(
  () => Array.from(oscStore.listenedMessageList)
    .reverse()
    .map((message, index) => ({
      title: message,
      // NOTE: そのままだと一瞬だけ重複してコンソールに警告が出るため、プレフィクスをつけて重複を回避
      value: `${index}_${message}`,
    }))
);

const onCloseDialog = () => {
  window.osc.stopListening();
};

const onSelectOscMessage = (prefixedTargetOscMessage: unknown) => {
  if (!(typeof prefixedTargetOscMessage === 'string')) {
    return;
  }

  let sliceAt = prefixedTargetOscMessage.indexOf('_');
  if (sliceAt <= -1) {
    return;
  }

  sliceAt++; // そのままsliceに使うと_がメッセージに含まれてしまう
  const targetOscMessage = prefixedTargetOscMessage.slice(sliceAt);
  emit('select-message', targetOscMessage);

  isVisible.value = false;
  onCloseDialog();
};
</script>

<template>
  <BaseDialog
    v-model="isVisible"
    :canClose="!oscStore.pending"
    @close="onCloseDialog"
  >
    <div class="mb-6">
      <h3 class="text-h5 mb-2">OSCメッセージ選択</h3>
      <p>受信したOSCメッセージを選択・設定できます</p>
    </div>
    <VBtn
      v-if="['CLOSE', 'OPEN'].includes(oscStore.oscStatus)"
      @click="oscStore.startListeningAll"
    >メッセージ受信開始</VBtn>
    <VProgressCircular v-else-if="oscStore.pending" indeterminate />
    <p v-else-if="oscStore.listenedMessageList.size <= 0" class="text-grey">
      メッセージを受信しています…<br />
      負けとしてカウントしたいことをやってみましょう<br />
      （例: 対戦ギミックで負ける）
    </p>
    <VList
      v-else
      class="text-left border overflow-auto rounded"
      density="compact"
      max-height="50vh"
      :items="listenedOscMessagesByNewest"
      @click:select="event => onSelectOscMessage(event.id)"
    />
  </BaseDialog>
</template>
