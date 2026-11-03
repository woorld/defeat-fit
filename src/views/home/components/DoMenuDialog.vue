<script setup lang="ts">
import { ref, computed } from 'vue';
import BaseDialog from '@src/components/common/BaseDialog.vue';
import { useDefeatCountStore } from '@src/stores/defeat-count';
import { menuUnitMap, calcMenuAmount, isMenuAmountCapped } from '@common/util';
import type { PresetWithMenus } from '@common/types';

const defeatCount = useDefeatCountStore();

const props = defineProps<{
  presetMenu: PresetWithMenus['presetMenuList'][number],
}>();

const model = defineModel<boolean>({ required: true });

const isDecimalVisible = ref(false);
const setCount = ref(1);

const totalReps = computed(
  () => calcMenuAmount(props.presetMenu.multiplier, defeatCount.count, props.presetMenu.menu.maxValue)
);
const isCapped = computed(
  () => isMenuAmountCapped(props.presetMenu.multiplier, defeatCount.count, props.presetMenu.menu.maxValue)
);
const secondsOrCountPerSet = computed(
  () => Math.floor(totalReps.value / setCount.value * 1000) / 1000 // 表示用に小数第4位以下を切り捨て
);
const isSecondsMenu = computed(() => props.presetMenu.menu.unit === 'SECOND');

// 割り切れない場合は、あまりを先頭のセットから1ずつ上乗せする
const baseAmountPerSet = computed(() => Math.floor(totalReps.value / setCount.value));
const remainder = computed(() => totalReps.value % setCount.value);
const timerCounterPath = computed(() => {
  const path = `/timer-counter/${isSecondsMenu.value ? 'timer' : 'counter'}/${baseAmountPerSet.value}/${setCount.value}`;
  return remainder.value > 0 ? `${path}?remainder=${remainder.value}` : path;
});

const stepSetCount = (addValue: 1 | -1) => {
  if (isDecimalVisible.value) {
    setCount.value += addValue;
    return;
  }

  // セット数を筋トレ回数が割り切れる数まで増やす
  let currentSetCount = setCount.value + addValue;
  while (totalReps.value % currentSetCount !== 0 && currentSetCount >= 1 && currentSetCount <= totalReps.value) {
    currentSetCount += addValue;
  }
  setCount.value = currentSetCount;
};

const restoreIntegerTotalReps = () => {
  if (Number.isInteger(secondsOrCountPerSet.value) || setCount.value <= 1) {
    return;
  }
  stepSetCount(-1);
};
</script>

<template>
  <BaseDialog v-model="model">
    <div class="d-flex justify-center align-center ga-8 flex-column">
      <h3 class="text-h5">セット数選択</h3>
      <div class="d-flex flex-center align-center flex-column ga-2">
        <div class="d-flex justify-center align-center ga-4 border rounded-xl">
          <VBtn
            flat
            icon="mdi-minus"
            :disabled="setCount <= 1"
            @click="stepSetCount(-1)"
          />
          <span class="set-count text-h4">{{ setCount }}</span>
          <VBtn
            flat
            icon="mdi-plus"
            :disabled="setCount >= totalReps"
            @click="stepSetCount(1)"
          />
        </div>
        <VIcon size="32">mdi-chevron-down</VIcon>
        <div class="d-flex justify-center align-baseline ga-2">
          <span class="text-body">
            <span :class="{ 'text-warning': isCapped }">{{ totalReps }} {{ menuUnitMap[props.presetMenu.menu.unit] }}</span>
            ÷ {{ setCount }} セット =
          </span>
          <span class="text-h4 text-green">{{ secondsOrCountPerSet }}</span>
          <span class="text-body">{{ menuUnitMap[props.presetMenu.menu.unit] }} / セット</span>
        </div>
        <div v-if="remainder > 0" class="text-body">
          （{{ baseAmountPerSet + 1 }} {{ menuUnitMap[props.presetMenu.menu.unit] }} × {{ remainder }} セット
          + {{ baseAmountPerSet }} {{ menuUnitMap[props.presetMenu.menu.unit] }} × {{ setCount - remainder }} セット）
        </div>
        <VCheckbox
          v-model="isDecimalVisible"
          label="割り切れないセット数を表示"
          hide-details
          @change="restoreIntegerTotalReps"
        />
      </div>
      <VBtn
        append-icon="mdi-chevron-right"
        color="green"
        :to="timerCounterPath"
        :disabled="!setCount"
      >
        {{ isSecondsMenu ? 'タイマー' : 'カウンター' }}画面へ
      </VBtn>
    </div>
  </BaseDialog>
</template>

<style scoped>
.set-count {
  width: 70px;
}
</style>
