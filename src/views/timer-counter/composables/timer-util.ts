import { computed, type Ref } from 'vue';

export function useTimerUtil(timerSeconds: Ref<number>, timerId: Ref<number | null>) {
  const timerDisplay = computed(() => {
    const minutes = String(Math.floor(timerSeconds.value / 60)).padStart(2, '0');
    const seconds = String(timerSeconds.value % 60).padStart(2, '0');
    return `${minutes} : ${seconds}`;
  });

  const playAudio = (audio: HTMLAudioElement) => {
    audio.currentTime = 0;
    audio.play();
  };

  const clearTimer = () => {
    if (!timerId.value) {
      return;
    }
    window.clearInterval(timerId.value);
    timerId.value = null;
  }

  return {
    timerDisplay,
    playAudio,
    clearTimer,
  };
}
