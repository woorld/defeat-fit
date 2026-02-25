import { computed, onUnmounted, ref, type Ref } from 'vue';
import { SETTING_DEFAULT_VALUE } from '@common/constants';
import setStartSound from '@src/assets/sound/timer/start.mp3';
import setEndSound from '@src/assets/sound/timer/end.mp3';
import countDecrementSound from '@src/assets/sound/timer/start-countdown.mp3';
import { useTimerUtil } from '../../composables/timer-util';

export type CounterStatus = 'STANDBY' | 'PROGRESS' | 'BREAK_TIME';

export function useCounter(
  count: Ref<number>,
  setCount: Ref<number>,
) {

  let recentCount = 0;
  let recentSetCount = 1;
  let breakTimeSeconds = SETTING_DEFAULT_VALUE.breakTimeSecBetweenSets;

  const setStartAudio = new Audio(setStartSound);
  const setEndAudio = new Audio(setEndSound);
  const countDecrementAudio = new Audio(countDecrementSound);

  const counterStatus = ref<CounterStatus>('STANDBY');
  const timerId = ref<number | null>(null);
  const timerSeconds = ref(0);

  // TODO: ここらへん必要？
  const isLockControl = computed(() => counterStatus.value !== 'STANDBY');
  const canStart = computed(() => count.value >= 1);

  const {
    timerDisplay,
    playAudio,
    clearTimer,
  } = useTimerUtil(timerSeconds, timerId);

  const startCount = () => {
    playAudio(setStartAudio);
    recentCount = count.value;
    recentSetCount = setCount.value;
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

    playAudio(setStartAudio);
    clearTimer();
    onNext();
  };

  const onNext = () => {
    if (counterStatus.value === 'BREAK_TIME') {
      // 休憩終了、次のセット開始
      clearTimer();
      counterStatus.value = 'PROGRESS';
      return;
    }

    // 1セット完了
    playAudio(setEndAudio);
    count.value = recentCount;
    setCount.value--;

    if (setCount.value <= 0) {
      setCount.value = recentSetCount;
      counterStatus.value = 'STANDBY';
      return;
    }

    timerSeconds.value = breakTimeSeconds;
    timerId.value = window.setInterval(timerLoop, 1000);
    counterStatus.value = 'BREAK_TIME';
  };

  const decrementCount = () => {
    count.value--;
    if (count.value <= 0) {
      return 0;
    }
    playAudio(countDecrementAudio);
    return count.value;
  };

  (async () => {
    const setting = await window.setting.getAllSetting();

    setStartAudio.volume = setting.soundVolume;
    setEndAudio.volume = setting.soundVolume;
    countDecrementAudio.volume = setting.soundVolume;
    breakTimeSeconds = setting.breakTimeSecBetweenSets;
  })();

  onUnmounted(() => {
    clearTimer();
    setStartAudio.pause();
    setEndAudio.pause();
    countDecrementAudio.pause();
  });

  return {
    counterStatus,
    isLockControl,
    canStart,
    timerDisplay,
    startCount,
    stopCount,
    onNext,
    decrementCount,
  };
}
