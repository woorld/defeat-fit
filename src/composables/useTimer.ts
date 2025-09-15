import { ref, computed, onUnmounted } from 'vue';
import type { Ref } from 'vue';
import timerStartCountdownSound from '../assets/timer-start-countdown.mp3';
import timerStartSound from '../assets/timer-start.mp3';
import timerEndSound from '../assets/timer-end.mp3';
import { SETTING_DEFAULT_VALUE } from '../../common/constants';
import type { Setting } from '../../common/types';

export function useTimer(timerSeconds: Ref<number>, setCount: Ref<number>) {
  let recentTimerSeconds = 0;
  let recentSetCount = 1;
  let audioPlayCount = 0;
  let breakTimeSeconds = SETTING_DEFAULT_VALUE.breakTimeSecBetweenSets;

  const soundTimerStartCountdown = new Audio(timerStartCountdownSound);
  const soundTimerStart = new Audio(timerStartSound);
  const soundTimerEnd = new Audio(timerEndSound);

  const applySetting = async () => {
    const setting: Setting = await window.setting.getAllSetting();

    soundTimerStartCountdown.volume = setting.soundVolume;
    soundTimerStart.volume = setting.soundVolume;
    soundTimerEnd.volume = setting.soundVolume;
    breakTimeSeconds = setting.breakTimeSecBetweenSets;
  };

  applySetting();

  const timerId = ref<number | null>(null);
  const timerStatus = ref<'STANDBY' | 'COUNTDOWN' | 'PROGRESS' | 'BREAK_TIME' |'END'>('STANDBY');

  const timerDisplay = computed(() => {
    const minutes = String(Math.floor(timerSeconds.value / 60)).padStart(2, '0');
    const seconds = String(timerSeconds.value % 60).padStart(2, '0');
    return `${minutes} : ${seconds}`;
  });
  const isLockControl = computed(() => timerStatus.value !== 'STANDBY');
  const isLockStartStop = computed(() => timerStatus.value === 'END' || timerSeconds.value <= 0);
  const canStart = computed(() => timerStatus.value === 'STANDBY');

  const startTimer = () => {
    timerStatus.value = 'COUNTDOWN';
    recentTimerSeconds = timerSeconds.value;
    recentSetCount = setCount.value;
    audioPlayCount = 0;

    timerLoop(); // NOTE: 最初の1回は即時実行したいためここで呼び出す
    timerId.value = window.setInterval(timerLoop, 1000);
  };

  const timerLoop = () => {
    switch(timerStatus.value) {
      case 'STANDBY':
        return;
      case 'COUNTDOWN':
        if (audioPlayCount >= 5) {
          playAudio(soundTimerStart);
          audioPlayCount = 0;
          timerStatus.value = 'PROGRESS';
        }
        else {
          playAudio(soundTimerStartCountdown);
          audioPlayCount++;
        }
        return;
      case 'PROGRESS':
        timerSeconds.value--;

        if (timerSeconds.value >= 1) {
          return;
        }

        setCount.value--;
        playAudio(soundTimerEnd); // NOTE: 最初の1回は即時実行したいためここで呼び出す
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
          playAudio(soundTimerStart);
          timerSeconds.value = recentTimerSeconds;
          timerStatus.value = 'PROGRESS';
          return;
        }

        if (timerSeconds.value <= 5) {
          playAudio(soundTimerStartCountdown);
          return;
        }
        return;
      case 'END':
        if (setCount.value <= 0 && audioPlayCount < 3) {
          // セットが0になった場合、効果音を追加で2回（合計3回）鳴らす
          playAudio(soundTimerEnd);
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

    window.clearInterval(timerId.value);
    timerId.value = null;
    timerStatus.value = 'STANDBY';
  };

  const playAudio = (audio: HTMLAudioElement) => {
    audio.currentTime = 0;
    audio.play();
  };

  onUnmounted(() => {
    if (timerId.value) {
      clearInterval(timerId.value);
    }

    soundTimerStartCountdown.pause();
    soundTimerStart.pause();
    soundTimerEnd.pause();
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
};
