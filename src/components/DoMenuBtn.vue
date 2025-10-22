<script setup lang="ts">
import { ref, computed } from 'vue';
import BaseDialog from './BaseDialog.vue';
import type { Menu } from '../../common/types';
import { useDefeatCountStore } from '../stores/defeat-count';

const defeatCount = useDefeatCountStore();

const props = defineProps<{
  menu: Menu,
}>();

const isDialogVisible = ref(false);
const isDecimalVisible = ref(false);
const setCount = ref(1);

const totalReps = computed(() => Math.ceil(props.menu.multiplier * defeatCount.count));
const secondsPerSet = computed(
  () => Math.floor(totalReps.value / setCount.value * 1000) / 1000 // 表示用に小数第4位以下を切り捨て
);

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
  if (Number.isInteger(secondsPerSet.value) || setCount.value <= 1) {
    return;
  }
  stepSetCount(-1);
};
</script>

<template>
  <VBtn
    :disabled="defeatCount.count <= 0"
    append-icon="mdi-chevron-right"
    color="green"
  >
    やる
    <BaseDialog v-model="isDialogVisible" activateByParent>
      <div class="d-flex justify-center align-center ga-8 flex-column">
        <h3 class="text-h5">何セットに分ける？</h3>
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
            <span class="text-body">{{ totalReps }} {{ props.menu.unit }} ÷ {{ setCount }} セット =</span>
            <span class="text-h4 text-green">{{ secondsPerSet }}</span>
            <span class="text-body">{{ props.menu.unit }} / セット</span>
          </div>
          <VCheckbox
            v-model="isDecimalVisible"
            label="割り切れないセット数を表示"
            hide-details
            @change="restoreIntegerTotalReps"
          />
        </div>
        <VBtn
          v-show="props.menu.unit === '秒'"
          append-icon="mdi-chevron-right"
          color="green"
          :to="`/timer/${Math.ceil(secondsPerSet)}/${setCount}`"
          :disabled="!setCount"
        >
          タイマー画面へ
          <VTooltip
            v-if="isDecimalVisible"
            text="小数は切り上げ"
            activator="parent"
          />
        </VBtn>
      </div>
    </BaseDialog>
  </VBtn>
</template>

<style scoped>
.set-count {
  width: 70px;
}
</style>
