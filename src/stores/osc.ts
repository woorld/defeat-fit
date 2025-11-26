import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useOscStore = defineStore('osc', () => {
  const isListening = ref(false);
  const loading = ref(true);

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

  (async () => {
    await window.osc.startListening();
    isListening.value = await window.osc.getListeningStatus();
    loading.value = false;
  })();

  return {
    isListening,
    loading,
    toggleListeningStatus,
  };
});
