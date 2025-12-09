import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import type { OscStatus } from '../../common/types';

export const useOscStore = defineStore('osc', () => {
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
    });
    window.osc.onListenAnyMessage((listenedMessage) => {
      listenedMessageList.value.add(listenedMessage);
    });

    window.osc.startListening();
  })();

  return {
    isListening,
    pending,
    listenedMessageList,
    toggleListeningStatus,
    startListeningAll,
  };
});
