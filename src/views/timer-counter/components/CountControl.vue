<script setup lang="ts">
import { computed } from 'vue';
import { menuUnitMap } from '@common/util';
import type { MenuUnit } from '@prisma-generated-client';

const props = defineProps<{
  isStandby: boolean,
  isBreakTime: boolean,
  unit: MenuUnit,
  amountPerSet: number,
  isLockControl: boolean,
}>();

const count = defineModel<number>('count', { required: true });
const setCount = defineModel<number>('setCount', { required: true });
const enableAutoCount = defineModel<boolean | null>('enableAutoCount', { default: null });
/** 1回（秒）多くするセットの残り数 */
const remainder = defineModel<number>('remainder', { default: 0 });

// 手動で変更した場合はあまりの配分を破棄し、全セット同じ回数（秒数）にする
const changeCount = (addValue: number) => {
  count.value += addValue;
  remainder.value = 0;
};

const changeSetCount = (value: number) => {
  setCount.value = value;
  remainder.value = 0;
};

const isRemainderAdded = computed(() => remainder.value > 0 && !props.isBreakTime);
</script>

<template>
  <div class="d-flex justify-space-between align-center ga-6" v-if="!props.isLockControl">
    <div class="d-flex justify-space-between align-center ga-4">
      <VLabel>セット数</VLabel>
      <VNumberInput
        class="flex-grow-0"
        :modelValue="setCount"
        @update:modelValue="changeSetCount"
        hide-details
        inset
        :min="1"
        :disabled="props.isLockControl"
      />
    </div>
    <VSwitch
      v-model="enableAutoCount"
      v-if="enableAutoCount != null"
      color="green"
      label="自動カウント"
      inset
      hide-details
      :disabled="props.isLockControl"
    />
  </div>
  <!-- NOTE: VDividerが中央に来るようにtext-align, widthを設定 -->
  <div class="d-flex justify-center align-center ga-4 w-100" v-if="!props.isStandby">
    <div class="w-50" :class="props.isBreakTime ? 'text-right' : 'text-center'">
      あと <span class="text-h4 ma-3">{{ setCount }}</span> セット
    </div>
    <template v-if="props.isBreakTime">
      <VDivider vertical />
      <span class="text-h5 text-green w-50">休憩中</span>
    </template>
  </div>
  <div class="d-flex justify-center align-center ga-4">
    <VBtn
      icon="mdi-chevron-double-left"
      :disabled="count < 10 || props.isLockControl"
      @click="changeCount(-10)"
    />
    <VBtn
      icon="mdi-chevron-left"
      :disabled="count < 1 || props.isLockControl"
      @click="changeCount(-1)"
    />
    <div class="step-count" :class="{ 'text-green': props.isBreakTime, 'text-warning': isRemainderAdded }">
      <slot />
      <VTooltip v-if="isRemainderAdded" activator="parent" location="top">
        {{ props.unit === 'SECOND' ? '秒数' : '回数' }} / セット数 で出た余りを加算しています。<br />
        {{ remainder }} セット後から {{ props.amountPerSet - 1 }} {{ menuUnitMap[props.unit] }}になります。
      </VTooltip>
    </div>
    <VBtn
      icon="mdi-chevron-right"
      :disabled="props.isLockControl"
      @click="changeCount(1)"
    />
    <VBtn
      icon="mdi-chevron-double-right"
      :disabled="props.isLockControl"
      @click="changeCount(10)"
    />
  </div>
</template>

<style scoped>
.step-count {
  width: 200px;
}
</style>
