import { useOscStore } from '@src/stores/osc';
import { ref, onUnmounted, watch, type Ref } from 'vue';
import type { CounterStatus } from './counter';

export function useAutoCount(args: {
  counterStatus: Ref<CounterStatus>,
  onNext: () => void,
  decrementCount: () => number,
}) {
  const oscStore = useOscStore();

  let setupTimerId: number | null = null;
  let hasReachedMin = false;

  const autoCountSetupStatus = ref<'MIN' | 'MAX' | 'DONE'>('MIN');
  const maxUpright = ref(1);
  const minUpright = ref(0);
  const uprightAdjust = ref(0.01); // TODO: 設定で変更できるようにする
  const autoCountSetupProgress = ref(0);

  const clearSetupTimer = () => {
    if (setupTimerId === null) {
      return;
    }
    window.clearInterval(setupTimerId);
    setupTimerId = null;
  }

  const getThreshold = (): Promise<number> => new Promise(resolve => {
    let recentUpright = oscStore.upright;

    // TODO: 効果音を鳴らす
    setupTimerId = window.setInterval(() => {
      const currentUpright = oscStore.upright;
      const withinAcceptableRange =
        currentUpright <= recentUpright + uprightAdjust.value &&
        currentUpright >= recentUpright - uprightAdjust.value;
      recentUpright = currentUpright;

      if (!withinAcceptableRange) {
        autoCountSetupProgress.value = 0;
        return;
      }

      autoCountSetupProgress.value++;

      if (autoCountSetupProgress.value < 5) {
        return;
      }

      clearSetupTimer();
      autoCountSetupProgress.value = 0;
      return resolve(currentUpright);
    }, 500);
  });

  const setupAutoCount = async (): Promise<void> => {
    autoCountSetupStatus.value = 'MIN';
    minUpright.value = await getThreshold();

    autoCountSetupStatus.value = 'MAX';
    maxUpright.value = await getThreshold();

    autoCountSetupStatus.value = 'DONE';
    autoCountSetupProgress.value = 0;
    return Promise.resolve();
  };

  const cancelAutoCountSetup = () => {
    autoCountSetupStatus.value = 'MAX';
    autoCountSetupProgress.value = 0;
    clearSetupTimer();
  };

  onUnmounted(() => {
    clearSetupTimer();
    if (oscStore.oscStatus === 'OPEN_UPRIGHT') {
      window.osc.stopListening();
    }
  });

  watch(() => oscStore.upright, (newValue) => {
    if (args.counterStatus.value !== 'PROGRESS') {
      return;
    }

    if (!hasReachedMin && newValue <= minUpright.value + uprightAdjust.value) {
      // 中間点(min)を通過
      hasReachedMin = true;
      return;
    }

    if (hasReachedMin && newValue >= maxUpright.value - uprightAdjust.value) {
      // 中間点(min)を通過後、初期位置(max)を通過
      const newCount = args.decrementCount();
      hasReachedMin = false;

      if (newCount <= 0) {
        args.onNext();
        return;
      }
    }
  });

  return {
    autoCountSetupStatus,
    maxUpright,
    minUpright,
    uprightAdjust,
    autoCountSetupProgress,
    setupAutoCount,
    cancelAutoCountSetup,
  };
}
