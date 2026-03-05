import { onUnmounted } from 'vue';

export function useAudio<T extends string>(namePathRecord: Record<T, string>) {
  const audios: Record<T, HTMLAudioElement> = {} as any; // NOTE: 型が壊れることはないので型アサーションしてOK

  const playAudio = (name: T) => {
    audios[name].currentTime = 0;
    audios[name].play();
  };

  // NOTE: playAudio()呼び出し時に音量設定が反映されている保証はないため、
  //       useAudio()呼び出し後すぐにplayAudio()する必要がある場合は要修正
  (async () => {
    const volume = await window.setting.getSetting('soundVolume');
    for (const name in namePathRecord) {
      audios[name] = new Audio(namePathRecord[name]);
      audios[name].volume = volume;
    }
  })();

  onUnmounted(() => {
    for (const name in audios) {
      audios[name].pause();
    }
  });

  return { playAudio };
}
