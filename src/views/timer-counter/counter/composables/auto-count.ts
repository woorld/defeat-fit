import { useOscStore } from '@src/stores/osc';
import { ref, onUnmounted, watch, type Ref } from 'vue';
import type { CounterStatus } from './counter';
import setupProgressSound from '@src/assets/sound/timer-counter/start-countdown.mp3';
import thresholdSetupCompleteSound from '@src/assets/sound/timer-counter/start.mp3';
import reachedMinSound from '@src/assets/sound/timer-counter/reach-min.mp3';
import setupStartMinSound from '@src/assets/sound/timer-counter/auto-count-setup-start-min.mp3';
import setupStartMaxSound from '@src/assets/sound/timer-counter/auto-count-setup-start-max.mp3';
import setupCompleteSound from '@src/assets/sound/timer-counter/auto-count-setup-complete.mp3';
import { useAudio } from '@src/composables/common/audio';

export type AutoCountSetupStatus = typeof autoCountSetupStage[keyof typeof autoCountSetupStage];

// NOTE: STANDBY→DONEまでの順番が決まっているため、文字列ではなく数値にして大小を比較できるようにする
export const autoCountSetupStage = {
  STANDBY: 0,
  MIN: 1,
  MAX: 2,
  DONE: 3,
} as const;

export function useAutoCount(args: {
  counterStatus: Ref<CounterStatus>,
  onNext: () => CounterStatus,
  decrementCount: () => number,
}) {
  const oscStore = useOscStore();
  const { playAudio } = useAudio({
    setupProgress: setupProgressSound,
    thresholdSetupComplete: thresholdSetupCompleteSound,
    reachedMin: reachedMinSound,
    setupStartMin: setupStartMinSound,
    setupStartMax: setupStartMaxSound,
    setupComplete: setupCompleteSound,
  });

  let setupTimerId: number | null = null;
  let hasReachedMin = false;

  const autoCountSetupStatus = ref<AutoCountSetupStatus>(autoCountSetupStage.STANDBY);
  const maxUpright = ref(1);
  const minUpright = ref(0);
  const uprightAdjust = ref(0.02); // TODO: 設定で変更できるようにする
  const autoCountSetupProgress = ref(0);

  const clearSetupTimer = () => {
    if (setupTimerId === null) {
      return;
    }
    window.clearInterval(setupTimerId);
    setupTimerId = null;
  };

  const getThreshold = (): Promise<number> => new Promise(resolve => {
    let recentUpright = oscStore.upright;

    setupTimerId = window.setInterval(() => {
      // NOTE: ボイス再生中にキャンセルした場合の中断処理
      if (autoCountSetupStatus.value <= autoCountSetupStage.STANDBY) {
        clearSetupTimer();
        return;
      }

      const currentUpright = oscStore.upright;
      const withinAcceptableRange =
        currentUpright <= recentUpright + uprightAdjust.value &&
        currentUpright >= recentUpright - uprightAdjust.value;
      recentUpright = currentUpright;

      if (!withinAcceptableRange) {
        // Uprightのブレが一定以上の場合
        autoCountSetupProgress.value = 0;
        return;
      }

      autoCountSetupProgress.value++;

      if (autoCountSetupProgress.value >= 3 && autoCountSetupProgress.value <= 5) {
        playAudio('setupProgress');
      }

      if (autoCountSetupProgress.value < 6) {
        return;
      }

      clearSetupTimer();
      autoCountSetupProgress.value = 0;
      return resolve(currentUpright);
    }, 500);
  });

  const setupAutoCount = async (): Promise<void> => {
    autoCountSetupStatus.value = autoCountSetupStage.MIN;
    playAudio('setupStartMin');
    minUpright.value = await getThreshold();

    autoCountSetupStatus.value = autoCountSetupStage.MAX;
    playAudio('setupStartMax');
    maxUpright.value = await getThreshold();

    autoCountSetupStatus.value = autoCountSetupStage.DONE;
    await playAudio('setupComplete');

    autoCountSetupProgress.value = 0;
    return Promise.resolve();
  };

  const resetAutoCountSetupStatus = () => {
    autoCountSetupStatus.value = autoCountSetupStage.STANDBY;
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
    if (args.counterStatus.value !== 'PROGRESS' || autoCountSetupStatus.value !== autoCountSetupStage.DONE) {
      return;
    }

    if (!hasReachedMin && newValue <= minUpright.value + uprightAdjust.value) {
      // 中間点(min)を通過
      hasReachedMin = true;
      playAudio('reachedMin');
      return;
    }

    if (hasReachedMin && newValue >= maxUpright.value - uprightAdjust.value) {
      // 中間点(min)を通過後、初期位置(max)を通過
      const newCount = args.decrementCount();
      hasReachedMin = false;

      if (newCount >= 1) {
        return;
      }

      const newCounterStatus = args.onNext();
      if (newCounterStatus === 'STANDBY') {
        resetAutoCountSetupStatus();
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
    resetAutoCountSetupStatus,
  };
}
