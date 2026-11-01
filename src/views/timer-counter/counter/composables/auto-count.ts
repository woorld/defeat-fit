import { useOscStore } from '@src/stores/osc';
import { ref, onUnmounted, watch, type Ref } from 'vue';
import type { CounterStatus } from './counter';
import setupProgressSound from '@src/assets/sound/timer-counter/start-countdown.mp3';
import thresholdSetupCompleteSound from '@src/assets/sound/timer-counter/start.mp3';
import reachedMinSound from '@src/assets/sound/timer-counter/reach-min.mp3';
import setupStartFirstSound from '@src/assets/sound/timer-counter/auto-count-setup-start-min.mp3';
import setupStartSecondSound from '@src/assets/sound/timer-counter/auto-count-setup-start-max.mp3';
import setupCompleteSound from '@src/assets/sound/timer-counter/auto-count-setup-complete.mp3';
import { useAudio } from '@src/composables/common/audio';

export type AutoCountSetupStatus = typeof autoCountSetupStage[keyof typeof autoCountSetupStage];

// NOTE: STANDBY→DONEまでの順番が決まっているため、文字列ではなく数値にして大小を比較できるようにする
export const autoCountSetupStage = {
  STANDBY: 0,
  FIRST: 1,
  SECOND: 2,
  DONE: 3,
} as const;

export function useAutoCount(args: {
  autoCountThresholdRange: number,
  counterStatus: Ref<CounterStatus>,
  onNext: () => CounterStatus,
  decrementCount: () => number,
}) {
  const oscStore = useOscStore();
  const { playAudio } = useAudio({
    setupProgress: setupProgressSound,
    thresholdSetupComplete: thresholdSetupCompleteSound,
    reachedMin: reachedMinSound,
    setupStartFirst: setupStartFirstSound,
    setupStartSecond: setupStartSecondSound,
    setupComplete: setupCompleteSound,
  });

  let setupTimerId: number | null = null;
  let hasReachedMin = false;

  const autoCountSetupStatus = ref<AutoCountSetupStatus>(autoCountSetupStage.STANDBY);
  const maxUpright = ref(1);
  const minUpright = ref(0);
  const autoCountSetupProgress = ref(0);

  const clearSetupTimer = () => {
    if (setupTimerId === null) {
      return;
    }
    window.clearInterval(setupTimerId);
    setupTimerId = null;
  };

  const getThreshold = (excludedUpright?: number): Promise<number> => new Promise(resolve => {
    let recentUpright = oscStore.upright;

    setupTimerId = window.setInterval(() => {
      // NOTE: ボイス再生中にキャンセルした場合の中断処理
      if (autoCountSetupStatus.value <= autoCountSetupStage.STANDBY) {
        clearSetupTimer();
        return;
      }

      const currentUpright = oscStore.upright;
      const withinAcceptableRange =
        currentUpright <= recentUpright + args.autoCountThresholdRange &&
        currentUpright >= recentUpright - args.autoCountThresholdRange;
      recentUpright = currentUpright;

      if (!withinAcceptableRange) {
        // Uprightのブレが一定以上の場合
        autoCountSetupProgress.value = 0;
        return;
      }

      // NOTE: 差が閾値の範囲内に収まるとmin/maxを交互に通過できずカウントされないため、
      // 取得後に取り直すのではなく、近い位置では進捗を進めない（同じ姿勢のまま取り直しと音声が繰り返されるのを防ぐ）
      if (excludedUpright !== undefined && Math.abs(currentUpright - excludedUpright) <= args.autoCountThresholdRange * 2) {
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
    autoCountSetupStatus.value = autoCountSetupStage.FIRST;
    playAudio('setupStartFirst');
    const firstUpright = await getThreshold();
    // NOTE: 2回目の取得中はmin側の範囲表示で1回目の位置を示す。maxにも入れるのは前回のセットアップの値を残さないため
    minUpright.value = firstUpright;
    maxUpright.value = firstUpright;

    autoCountSetupStatus.value = autoCountSetupStage.SECOND;
    playAudio('setupStartSecond');
    const secondUpright = await getThreshold(firstUpright);

    minUpright.value = Math.min(firstUpright, secondUpright);
    maxUpright.value = Math.max(firstUpright, secondUpright);

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

    if (!hasReachedMin && newValue <= minUpright.value + args.autoCountThresholdRange) {
      // 中間点(min)を通過
      hasReachedMin = true;
      playAudio('reachedMin');
      return;
    }

    if (hasReachedMin && newValue >= maxUpright.value - args.autoCountThresholdRange) {
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
    autoCountSetupProgress,
    setupAutoCount,
    resetAutoCountSetupStatus,
  };
}
