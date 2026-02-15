<script setup lang="ts">
import type { OscReceivedSoundSetting } from '@common/types';

type OscReceivedSoundSelectItem = {
  title: string,
  value: OscReceivedSoundSetting,
};

const OscReceivedSoundSelectItems: OscReceivedSoundSelectItem[] = [
  { title: 'なし', value: null },
  { title: '剣で斬る', value: 'slash' },
  { title: '何かを引っこ抜く', value: 'pull' },
  { title: '爆発', value: 'explode' },
  { title: 'ちーん', value: 'bell-small' },
  { title: 'ごーん', value: 'bell-large' },
  { title: '銃で撃つ', value: 'shoot' },
  { title: '拳で殴る', value: 'hit' },
] as const;

const model = defineModel<OscReceivedSoundSetting>({ required: true });
</script>

<template>
  <VSelect
    v-model="model"
    label="対象OSCメッセージ受信時の効果音"
    hide-details
    :items="OscReceivedSoundSelectItems"
  />
</template>
