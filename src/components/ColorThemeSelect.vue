<script setup lang="ts">
import type { ColorThemeSetting } from '@common/types';

type ColorThemeSelectItem = {
  title: string,
  value: ColorThemeSetting,
};

const colorThemeSelectItems: ColorThemeSelectItem[] = [
  { title: 'ライト', value: 'light' },
  { title: 'ダーク', value: 'dark' },
  { title: 'システム設定に合わせる', value: 'system' },
] as const;

const model = defineModel<ColorThemeSetting>({ required: true });
</script>

<template>
  <VSelect
    v-model="model"
    label="カラーテーマ"
    hide-details
    :items="colorThemeSelectItems"
  />
</template>
