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
const setCount = ref(4);

const secondsPerSet = computed(() => Math.ceil((defeatCount.count * props.menu.multiplier) / setCount.value));
const maxSet = computed(() => secondsPerSet.value === 1
  ? setCount.value // 1回あたり1秒になる場合、それ以上セット数を増やしても意味がないため+を押させない
  : Infinity
);
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
        <div class="d-flex justify-center align-center ga-4">
          <VNumberInput
            v-model="setCount"
            inset
            hide-details
            max-width="120"
            :min="1"
            :max="maxSet"
          />
          <VIcon>mdi-arrow-right</VIcon>
          <span class="d-flex justify-center align-baseline ga-2">
            <span class="text-h6">1セット</span>
            <span class="text-h4">{{ secondsPerSet }}</span>
            <span class="text-h6">{{ props.menu.unit }}</span>
          </span>
        </div>
        <small class="text-grey">※小数繰り上げ</small>
        <VBtn
          v-show="props.menu.unit === '秒'"
          append-icon="mdi-chevron-right"
          color="green"
          :to="`/timer/${secondsPerSet}/${setCount}`"
        >タイマー画面へ</VBtn>
      </div>
    </BaseDialog>
  </VBtn>
</template>
