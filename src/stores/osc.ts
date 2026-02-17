import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import type { OscStatus } from '@common/types';
import { useDefeatCountStore } from '@src/stores/defeat-count';

export const useOscStore = defineStore('osc', () => {
  const defeatCountStore = useDefeatCountStore();
  const oscStatus = ref<OscStatus>('CLOSE');
  const listenedMessageList = ref(new Set<string>());

  const isListening = computed(() => ['OPEN', 'OPEN_ALL'].includes(oscStatus.value));
  const pending = computed(() => oscStatus.value === 'PENDING');

  const toggleListeningStatus = async () => {
    if (pending.value) {
      return;
    }

    isListening.value
      ? window.osc.stopListening()
      : window.osc.startListening();
  };

  const startListeningAll = async () => {
    listenedMessageList.value.clear();
    await window.osc.stopListening();
    return window.osc.startListeningAll();
  };

  (async () => {
    oscStatus.value = await window.osc.getOscStatus();

    window.osc.onChangeOscStatus((newOscStatus) => {
      oscStatus.value = newOscStatus;
      if (newOscStatus === 'OPEN') {
        defeatCountStore.updateSoundSetting();
      }
    });
    window.osc.onListenAnyMessage((listenedMessage) => {
      listenedMessageList.value.add(listenedMessage);
    });

    window.osc.startListening();
  })();

  return {
    oscStatus,
    listenedMessageList,
    isListening,
    pending,
    toggleListeningStatus,
    startListeningAll,
  };
});
