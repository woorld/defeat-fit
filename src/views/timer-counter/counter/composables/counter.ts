import { computed, onUnmounted, ref, type Ref } from 'vue';
import { SETTING_DEFAULT_VALUE } from '@common/constants';
import setStartSound from '@src/assets/sound/timer/start.mp3';
import setEndSound from '@src/assets/sound/timer/end.mp3';
import { useTimerUtil } from '../../composables/timer-util';

export function useCounter(count: Ref<number>, setCount: Ref<number>) {
  // TODO: OVR連携の自動カウント機能実装時にrecentCountの追加が必要
  let recentSetCount = 1;
  let breakTimeSeconds = SETTING_DEFAULT_VALUE.breakTimeSecBetweenSets;

  const setStartAudio = new Audio(setStartSound);
  const setEndAudio = new Audio(setEndSound);

  const counterStatus = ref<'STANDBY' | 'PROGRESS' | 'BREAK_TIME'>('STANDBY');
  const timerId = ref<number | null>(null);
  const timerSeconds = ref(0);

  const isLockControl = computed(() => counterStatus.value !== 'STANDBY');
  const canStart = computed(() => count.value >= 1);

  const {
    timerDisplay,
    playAudio,
    clearTimer,
  } = useTimerUtil(timerSeconds, timerId);

  const startCount = () => {
    playAudio(setStartAudio);
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

  (async () => {
    const setting = await window.setting.getAllSetting();

    setStartAudio.volume = setting.soundVolume;
    setEndAudio.volume = setting.soundVolume;
    breakTimeSeconds = setting.breakTimeSecBetweenSets;
  })();

  onUnmounted(() => {
    clearTimer();
    setStartAudio.pause();
    setEndAudio.pause();
  });

  return {
    counterStatus,
    isLockControl,
    canStart,
    timerDisplay,
    startCount,
    stopCount,
    onNext,
  };
}
