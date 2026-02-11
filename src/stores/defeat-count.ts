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

export const useDefeatCountStore = defineStore('defeat-count', () => {
  const audio = new Audio();
  let shouldPlayAudio = false;

  const count = ref(0);

  const decrement = async () => {
    count.value = await window.defeatCount.decrementDefeatCount();
  };

  const getDefeatCount = async () => {
    count.value = await window.defeatCount.getDefeatCount();
  };

  const updateSoundSetting = async () => {
    const soundVariant = await window.setting.getSetting('oscReceivedSound');
    if (soundVariant == null || !Object.keys(oscReceivedSounds).includes(soundVariant)) {
      shouldPlayAudio = false;
      return;
    }

    shouldPlayAudio = true;
    audio.src = oscReceivedSounds[soundVariant];
    audio.volume = await window.setting.getSetting('soundVolume');
  }

  const playOscReceivedSound = () => {
    if (!shouldPlayAudio) {
      return;
    }

    audio.currentTime = 0;
    audio.play();
  };

  (() => {
    getDefeatCount();
    updateSoundSetting();

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
    updateSoundSetting,
  };
});
