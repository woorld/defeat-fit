import { ref, onUnmounted, type Ref } from 'vue';
import { SETTING_DEFAULT_VALUE } from '@common/constants';
import timerStartCountdownSound from '@src/assets/sound/timer-counter/start-countdown.mp3';
import timerStartSound from '@src/assets/sound/timer-counter/start.mp3';
import timerEndSound from '@src/assets/sound/timer-counter/end.mp3';
import { useTimerUtil } from '../../composables/timer-util';
import { useAudio } from '@src/composables/common/audio';

export function useTimer(timerSeconds: Ref<number>, setCount: Ref<number>) {
  let recentTimerSeconds = 0;
  let recentSetCount = 1;
  let audioPlayCount = 0;
  let breakTimeSeconds = SETTING_DEFAULT_VALUE.breakTimeSecBetweenSets;

  const timerStatus = ref<'STANDBY' | 'COUNTDOWN' | 'PROGRESS' | 'BREAK_TIME' |'END'>('STANDBY');
  const timerId = ref<number | null>(null);

  const {
    timerDisplay,
    clearTimer,
  } = useTimerUtil(timerSeconds, timerId);

  const { playAudio } = useAudio({
    timerStartCountdown: timerStartCountdownSound,
    timerStart: timerStartSound,
    timerEnd: timerEndSound,
  });

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
          playAudio('timerStart');
          audioPlayCount = 0;
          timerStatus.value = 'PROGRESS';
        }
        else {
          playAudio('timerStartCountdown');
          audioPlayCount++;
        }
        return;
      case 'PROGRESS':
        timerSeconds.value--;

        if (timerSeconds.value >= 1) {
          return;
        }

        setCount.value--;
        playAudio('timerEnd'); // NOTE: 最初の1回は即時実行したいためここで呼び出す
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
          playAudio('timerStart');
          timerSeconds.value = recentTimerSeconds;
          timerStatus.value = 'PROGRESS';
          return;
        }

        if (timerSeconds.value <= 5) {
          playAudio('timerStartCountdown');
          return;
        }
        return;
      case 'END':
        if (setCount.value <= 0 && audioPlayCount < 3) {
          // セットが0になった場合、効果音を追加で2回（合計3回）鳴らす
          playAudio('timerEnd');
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
    breakTimeSeconds = await window.setting.getSetting('breakTimeSecBetweenSets');
  })();

  onUnmounted(() => {
    clearTimer();
  });

  return {
    timerStatus,
    timerDisplay,
    startTimer,
    stopTimer,
  };
}
