<script setup lang="ts">
import { computed, ref } from 'vue';
import BaseDialog from '@src/components/common/BaseDialog.vue';
import { useOscStore } from '@src/stores/osc';

const oscStore = useOscStore();

const emit = defineEmits<{
  (e: 'select-message', message: string): void,
}>();

const isVisible = ref(false);
const showOnlyAvatarParameters = ref(true);

const listenedOscMessagesByNewest = computed(() => {
  const reversed = Array.from(oscStore.listenedMessageList)
    .reverse()
    .map((message, index) => ({
      title: message,
      // NOTE: そのままだと一瞬だけ重複してコンソールに警告が出るため、プレフィクスをつけて重複を回避
      value: `${index}_${message}`,
    }));

  return showOnlyAvatarParameters.value
    ? reversed.filter(item => item.title.startsWith('/avatar/parameters'))
    : reversed;
});

const onCloseDialog = () => {
  // NOTE: @clickに直接指定するとwindowオブジェクトが存在しない
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
};
</script>

<template>
  <BaseDialog
    v-model="isVisible"
    :canClose="!oscStore.pending"
    @close="onCloseDialog"
  >
    <div class="mb-8">
      <h3 class="text-h5 mb-2">OSCメッセージ選択</h3>
      <p>受信したOSCメッセージを選択・設定できます</p>
    </div>
    <VBtn
      v-if="['CLOSE', 'OPEN'].includes(oscStore.oscStatus)"
      class="elevation-0 border"
      @click="oscStore.startListeningAll"
    >メッセージ受信開始</VBtn>
    <VProgressCircular v-else-if="oscStore.pending" indeterminate />
    <template v-else>
      <div class="border-e border-b border-s rounded overflow-hidden">
        <VProgressLinear indeterminate height="1" />
        <p v-if="listenedOscMessagesByNewest.length <= 0" class="text-grey py-6">
          カウントしたいことを実際にやってみましょう<br />
          （例: 対戦ギミックで負ける）
        </p>
        <VList
          v-else
          class="text-left overflow-auto py-0"
          density="compact"
          max-height="50vh"
          :items="listenedOscMessagesByNewest"
          @click:select="event => onSelectOscMessage(event.id)"
        />
      </div>
      <VCheckbox
        class="d-flex justify-center align-center mt-6"
        v-model="showOnlyAvatarParameters"
        label="アバターに関係するOSCメッセージのみ表示する"
        density="compact"
        hide-details
      />
    </template>
  </BaseDialog>
</template>
