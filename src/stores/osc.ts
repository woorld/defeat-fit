import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import type { OscStatus } from '@common/types';
import { useDefeatCountStore } from '@src/stores/defeat-count';

export const useOscStore = defineStore('osc', () => {
  const defeatCountStore = useDefeatCountStore();

  const oscStatus = ref<OscStatus>('CLOSE');
  const listenedMessageList = ref(new Set<string>());
  const upright = ref(0);

  const isListening = computed(() => {
    const listeningStatus: OscStatus[] = ['OPEN', 'OPEN_ALL', 'OPEN_UPRIGHT'];
    return listeningStatus.includes(oscStatus.value);
  })
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

  const startListeningUpright = async () => {
    upright.value = 0;
    await window.osc.stopListening();
    return window.osc.startListeningUpright();
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
    window.osc.onListenUprightValue((uprightValue) => {
      upright.value = uprightValue;
    });

    window.osc.startListening();
  })();

  return {
    oscStatus,
    listenedMessageList,
    upright,
    isListening,
    pending,
    toggleListeningStatus,
    startListeningAll,
    startListeningUpright,
  };
});
