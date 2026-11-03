import { onUnmounted, ref, type Ref } from 'vue';
import { SETTING_DEFAULT_VALUE } from '@common/constants';
import setStartSound from '@src/assets/sound/timer-counter/start.mp3';
import setEndSound from '@src/assets/sound/timer-counter/end.mp3';
import countDecrementSound from '@src/assets/sound/timer-counter/start-countdown.mp3';
import { useTimerUtil } from '../../composables/timer-util';
import { useAudio } from '@src/composables/common/audio';

export type CounterStatus = 'STANDBY' | 'PROGRESS' | 'BREAK_TIME';

export function useCounter(count: Ref<number>, setCount: Ref<number>, remainder: Ref<number>) {
  let recentCount = 0; // 実施中のセットの回数
  let initialCount = 0;
  let initialSetCount = 1;
  let initialRemainder = 0;
  let breakTimeSeconds = SETTING_DEFAULT_VALUE.breakTimeSecBetweenSets;

  const counterStatus = ref<CounterStatus>('STANDBY');
  const timerId = ref<number | null>(null);
  const timerSeconds = ref(0);

  const {
    timerDisplay,
    clearTimer,
  } = useTimerUtil(timerSeconds, timerId);

  const { playAudio } = useAudio({
    setStart: setStartSound,
    setEnd: setEndSound,
    countDecrement: countDecrementSound,
  });

  const startCount = () => {
    playAudio('setStart');
    recentCount = count.value;
    initialCount = count.value;
    initialSetCount = setCount.value;
    initialRemainder = remainder.value;
    counterStatus.value = 'PROGRESS';
  };

  const stopCount = () => {
    clearTimer();
    counterStatus.value = 'STANDBY';
  };

  const timerLoop = () => {
    timerSeconds.value--;
    if (timerSeconds.value >= 1) {
      return;
    }

    playAudio('setStart');
    clearTimer();
    onNext();
  };

  const onNext = (): CounterStatus => {
    if (counterStatus.value === 'BREAK_TIME') {
      // 休憩終了、次のセット開始
      clearTimer();
      counterStatus.value = 'PROGRESS';
      return counterStatus.value;
    }

    // 1セット完了
    playAudio('setEnd');
    setCount.value--;

    if (setCount.value <= 0) {
      count.value = initialCount;
      setCount.value = initialSetCount;
      remainder.value = initialRemainder;
      counterStatus.value = 'STANDBY';
      return counterStatus.value;
    }

    // あまりを上乗せするセットが終わったら、以降のセットは1回少なくする
    if (remainder.value > 0) {
      remainder.value--;
      if (remainder.value === 0) {
        recentCount--;
      }
    }
    count.value = recentCount;

    timerSeconds.value = breakTimeSeconds;
    timerId.value = window.setInterval(timerLoop, 1000);
    counterStatus.value = 'BREAK_TIME';
    return counterStatus.value;
  };

  const decrementCount = (): number => {
    count.value--;
    if (count.value <= 0) {
      return 0;
    }
    playAudio('countDecrement');
    return count.value;
  };

  (async () => {
    breakTimeSeconds = await window.setting.getSetting('breakTimeSecBetweenSets');
  })();

  onUnmounted(() => {
    clearTimer();
  });

  return {
    counterStatus,
    timerDisplay,
    startCount,
    stopCount,
    onNext,
    decrementCount,
  };
}
