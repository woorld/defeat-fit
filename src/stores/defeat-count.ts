import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { OscReceivedSoundSetting } from '../../common/types';
import soundSlash from '../assets/sound/defeat/slash.mp3';
import soundPull from '../assets/sound/defeat/pull.mp3';
import soundExplode from '../assets/sound/defeat/explode.mp3';
import soundBellSmall from '../assets/sound/defeat/bell-small.mp3';
import soundBellLarge from '../assets/sound/defeat/bell-large.mp3';
import soundShoot from '../assets/sound/defeat/shoot.mp3';
import soundHit from '../assets/sound/defeat/hit.mp3';

const oscReceivedSounds: Record<Exclude<OscReceivedSoundSetting, null>, string> = {
  'slash': soundSlash,
  'pull': soundPull,
  'explode': soundExplode,
  'bell-small': soundBellSmall,
  'bell-large': soundBellLarge,
  'shoot': soundShoot,
  'hit': soundHit,
};

const playOscReceivedSound = async () => {
  // TODO: 実行するたびに設定とってくるの何とかしたい OSCのストアと連携してOSCのリッスンが開始されたときに設定を取得して保持する？
  const soundVariant = await window.setting.getSetting('oscReceivedSound');

  if (soundVariant == null || !Object.keys(oscReceivedSounds).includes(soundVariant)) {
    return;
  }

  const soundVolume = await window.setting.getSetting('soundVolume');
  const audio = new Audio(oscReceivedSounds[soundVariant]);
  audio.volume = soundVolume;
  // audio.currentTime = 0;
  audio.play();
};

export const useDefeatCountStore = defineStore('defeat-count', () => {
  const count = ref(0);

  const decrement = async () => {
    count.value = await window.defeatCount.decrementDefeatCount();
  };

  const getDefeatCount = async () => {
    count.value = await window.defeatCount.getDefeatCount();
  };

  (async () => {
    getDefeatCount();
    window.defeatCount.onUpdateDefeatCount((newCount) => {
      if (newCount > count.value) {
        playOscReceivedSound();
      }
      count.value = newCount;
    });
  })();

  return {
    count,
    decrement,
  };
});
