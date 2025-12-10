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
  () => Array.from(oscStore.listenedMessageList).reverse()
);

const onCloseDialog = () => {
  window.osc.stopListening();
};

const onSelectOscMessage = (targetOscMessage: unknown) => {
  if (!(typeof targetOscMessage === 'string')) {
    return;
  }

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
    <VProgressCircular v-if="oscStore.pending" indeterminate />
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
