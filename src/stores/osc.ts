import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useOscStore = defineStore('osc', () => {
  const isListening = ref(false);
  const loading = ref(true);
  const listenedMessageList = ref(new Set<string>());

  const toggleListeningStatus = async () => {
    loading.value = true;

    if (isListening.value) {
      await window.osc.stopListening();
    }
    else {
      await window.osc.startListening();
    }

    isListening.value = await window.osc.getListeningStatus();
    loading.value = false;
  };

  const startListeningAll = async () => {
    listenedMessageList.value.clear();
    await window.osc.stopListening();
    return window.osc.startListeningAll();
  };

  (async () => {
    window.osc.onListenAnyMessage((listenedMessage) => {
      listenedMessageList.value.add(listenedMessage);
    });

    await window.osc.startListening();
    isListening.value = await window.osc.getListeningStatus();
    loading.value = false;
  })();

  return {
    isListening,
    loading,
    listenedMessageList,
    toggleListeningStatus,
    startListeningAll,
  };
});
