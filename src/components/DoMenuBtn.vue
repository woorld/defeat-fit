<script setup lang="ts">
import { ref, computed } from 'vue';
import BaseDialog from './BaseDialog.vue';
import type { Menu } from '../../common/types';
import { useDefeatCountStore } from '../stores/defeat-count';

const defeatCount = useDefeatCountStore();

const props = defineProps<{
  menu: Menu,
}>();

const isVisibleDialog = ref(false);
const setCount = ref(1);

const doMenuCount = computed(() => defeatCount.count * props.menu.multiplier);
const secondsPerSet = computed(() => Math.ceil(doMenuCount.value / setCount.value));
const maxSet = computed(() => secondsPerSet.value === 1
  ? setCount.value // 1回あたり1秒になる場合、それ以上セット数を増やしても意味がないため+を押させない
  : Infinity
);

const stepSetCount = (addValue: 1 | -1) => {
  let currentSetCount = setCount.value + addValue;
  while (doMenuCount.value % currentSetCount !== 0 && currentSetCount >= 1 && currentSetCount <= maxSet.value) {
    currentSetCount += addValue;
  }
  setCount.value = currentSetCount;
};
</script>

<template>
  <VBtn
    :disabled="defeatCount.count <= 0"
    append-icon="mdi-chevron-right"
    color="green"
  >
    やる
    <BaseDialog v-model="isVisibleDialog" activateByParent>
      <div class="d-flex justify-center align-center ga-6 flex-column">
        <h3 class="text-h5">何セットに分ける？</h3>
        <div class="d-flex justify-center align-center ga-4 flex-column">
          <div class="d-flex justify-center align-center ga-4">
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
              :disabled="setCount >= maxSet"
              @click="stepSetCount(1)"
            />
          </div>
          <VIcon size="32">mdi-chevron-down</VIcon>
          <span class="d-flex justify-center align-baseline ga-2">
            <span class="text-body">{{ doMenuCount }} {{ props.menu.unit }} ÷ {{ setCount }} セット =</span>
            <span class="text-h4 text-green">{{ secondsPerSet }}</span>
            <span class="text-body">{{ props.menu.unit }} / セット</span>
          </span>
        </div>
        <small class="text-grey">※小数繰り上げ</small>
        <VBtn
          v-show="props.menu.unit === '秒'"
          append-icon="mdi-chevron-right"
          color="green"
          :to="`/timer/${secondsPerSet}/${setCount}`"
          :disabled="!setCount"
        >タイマー画面へ</VBtn>
      </div>
    </BaseDialog>
  </VBtn>
</template>

<style scoped>
.set-count {
  width: 70px;
}
</style>
