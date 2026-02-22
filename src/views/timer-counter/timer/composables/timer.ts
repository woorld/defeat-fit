import { ref, computed, onUnmounted, type Ref } from 'vue';
import { SETTING_DEFAULT_VALUE } from '@common/constants';
import timerStartCountdownSound from '@src/assets/sound/timer/start-countdown.mp3';
import timerStartSound from '@src/assets/sound/timer/start.mp3';
import timerEndSound from '@src/assets/sound/timer/end.mp3';
import { useTimerUtil } from '../../composables/timer-util';

export function useTimer(timerSeconds: Ref<number>, setCount: Ref<number>) {
  let recentTimerSeconds = 0;
  let recentSetCount = 1;
  let audioPlayCount = 0;
  let breakTimeSeconds = SETTING_DEFAULT_VALUE.breakTimeSecBetweenSets;

  const timerStartCountdownAudio = new Audio(timerStartCountdownSound);
  const timerStartAudio = new Audio(timerStartSound);
  const timerEndAudio = new Audio(timerEndSound);

  const timerStatus = ref<'STANDBY' | 'COUNTDOWN' | 'PROGRESS' | 'BREAK_TIME' |'END'>('STANDBY');
  const timerId = ref<number | null>(null);

  const isLockControl = computed(() => timerStatus.value !== 'STANDBY');
  const isLockStartStop = computed(() => timerStatus.value === 'END' || timerSeconds.value <= 0);
  const canStart = computed(() => timerStatus.value === 'STANDBY');

  const {
    timerDisplay,
    playAudio,
    clearTimer,
  } = useTimerUtil(timerSeconds, timerId);

  const startTimer = () => {
    timerStatus.value = 'COUNTDOWN';
    recentTimerSeconds = timerSeconds.value;
    recentSetCount = setCount.value;
    audioPlayCount = 0;

    timerLoop(); // NOTE: 最初の1回は即時実行したいためここで呼び出す
    timerId.value = window.setInterval(timerLoop, 1000);
  };

  const stopTimer = () => {
    if (timerId.value == null) {
      return;
    }

    if (setCount.value <= 0) {
      setCount.value = recentSetCount;
    }

    if (timerSeconds.value <= 0 || timerStatus.value === 'BREAK_TIME') {
      timerSeconds.value = recentTimerSeconds;
    }

    clearTimer();
    timerStatus.value = 'STANDBY';
  };

  const timerLoop = () => {
    switch(timerStatus.value) {
      case 'STANDBY':
        return;
      case 'COUNTDOWN':
        if (audioPlayCount >= 5) {
          playAudio(timerStartAudio);
          audioPlayCount = 0;
          timerStatus.value = 'PROGRESS';
        }
        else {
          playAudio(timerStartCountdownAudio);
          audioPlayCount++;
        }
        return;
      case 'PROGRESS':
        timerSeconds.value--;

        if (timerSeconds.value >= 1) {
          return;
        }

        setCount.value--;
        playAudio(timerEndAudio); // NOTE: 最初の1回は即時実行したいためここで呼び出す
        audioPlayCount++;

        if (setCount.value <= 0) {
          timerStatus.value = 'END';
          return;
        }

        audioPlayCount = 0;
        timerStatus.value = 'BREAK_TIME';
        timerSeconds.value = breakTimeSeconds;
        return;
      case 'BREAK_TIME':
        timerSeconds.value--;

        if (timerSeconds.value <= 0) {
          playAudio(timerStartAudio);
          timerSeconds.value = recentTimerSeconds;
          timerStatus.value = 'PROGRESS';
          return;
        }

        if (timerSeconds.value <= 5) {
          playAudio(timerStartCountdownAudio);
          return;
        }
        return;
      case 'END':
        if (setCount.value <= 0 && audioPlayCount < 3) {
          // セットが0になった場合、効果音を追加で2回（合計3回）鳴らす
          playAudio(timerEndAudio);
          audioPlayCount++;
          return;
        }
        audioPlayCount = 0;
        stopTimer();
        return;
      default:
        return;
    }
  };

  (async () => {
    const setting = await window.setting.getAllSetting();

    timerStartCountdownAudio.volume = setting.soundVolume;
    timerStartAudio.volume = setting.soundVolume;
    timerEndAudio.volume = setting.soundVolume;
    breakTimeSeconds = setting.breakTimeSecBetweenSets;
  })();

  onUnmounted(() => {
    clearTimer();
    timerStartCountdownAudio.pause();
    timerStartAudio.pause();
    timerEndAudio.pause();
  });

  return {
    timerStatus,
    timerDisplay,
    isLockControl,
    isLockStartStop,
    canStart,
    startTimer,
    stopTimer,
  };
}
