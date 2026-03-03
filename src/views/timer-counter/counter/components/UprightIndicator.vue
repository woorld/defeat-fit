<script setup lang="ts">
import { computed } from 'vue';
import { useTheme } from 'vuetify';
import { autoCountSetupStage, type AutoCountSetupStatus } from '../composables/auto-count';

const theme = useTheme();

const props = defineProps<{
  currentUpright: number,
  maxUpright: number,
  minUpright: number,
  uprightAdjust: number,
  autoCountSetupStatus: AutoCountSetupStatus,
  isPointerVisible: boolean,
}>();

// NOTE: 要素の表示・非表示やスタイリングは<style>で行うよう統一する
const colorClass = computed(() => theme.current.value.dark ? 'dark' : 'light');
const pointerDisplay = computed(() => props.isPointerVisible ? 'visible' : 'hidden');
const minThresholdDisplay = computed(() => props.autoCountSetupStatus > autoCountSetupStage.MIN ? 'visible' : 'hidden');
const maxThresholdDisplay = computed(() => props.autoCountSetupStatus > autoCountSetupStage.MAX ? 'visible' : 'hidden');
</script>

<template>
  <div class="upright-indicator-wrapper">
    <div class="upright-indicator" :class="colorClass">
      <div class="upright-indicator__threshold-area" />
    </div>
    <div class="upright-threshold-bubble min" :class="colorClass">MIN</div>
    <div class="upright-threshold-bubble max" :class="colorClass">MAX</div>
  </div>
</template>

<style scoped lang="scss">
$indicator-width: 8px;
$indicator-inner-height: 1%;

@function binded-bottom($bind, $height) {
  @return calc($bind * 100% - $height / 2);
}

.upright-indicator {
  position: absolute;
  width: $indicator-width;
  height: 100%;
  overflow: hidden;
  border-radius: 50px;

  // Uprightの値を示す要素
  &::before {
    content: "";
    position: absolute;
    bottom: binded-bottom(v-bind(currentUpright), $indicator-inner-height);
    left: 0;
    width: 100%;
    height: $indicator-inner-height;
    transition: 100ms ease-out;
  }

  // TODO: カラーをべた書きからVuetifyのカラーを取得・適用するようにする
  &.light {
    background-color: #e4e4e4;
    &::before {
      background-color: #1e1e1e;
    }
  }
  &.dark {
    background-color: #2f2f2f;
    &::before {
      background-color: #fff;
    }
  }

  // MAX, MINの範囲表示
  &__threshold-area {
    // NOTE: 上下方向にuprightAdjust分高さを増やすため2倍したものを加算する
    $threshold-area-height: calc($indicator-inner-height + v-bind(uprightAdjust) * 2 * 100%);

    &::before, &::after {
      content: "";
      position: absolute;
      left: 0;
      width: 100%;
      height: $threshold-area-height;
      background-color: red;
      opacity: 0.5;
    }

    &::before {
      bottom: binded-bottom(v-bind(minUpright), $threshold-area-height);
    }
    &::after {
      bottom: binded-bottom(v-bind(maxUpright), $threshold-area-height);
    }
  }
}

.upright-indicator-wrapper {
  $margin-y: 40px; // NOTE: タイマー・カウンターのトグルの上の余白に合わせている
  $navbar-height: 56px; // NOTE: 明示的に指定された高さではないため注意

  position: fixed;
  top: $margin-y;
  bottom: $margin-y + $navbar-height;
  right: 32px;
  z-index: 3000; // NOTE: セットアップオーバーレイ(2000)より手前に表示するため
}

.upright-threshold-bubble {
  $bubble-height: 24px;

  width: $bubble-height * 2;
  height: $bubble-height;
  position: absolute;
  right: 16px;
  border-radius: 4px 0 0 4px;
  margin-right: 8px;
  font-size: 14px;
  display: flex;
  justify-content: center;
  align-items: center;

  // >の部分
  &::before {
    content: "";
    position: absolute;
    right: calc($bubble-height * -1 / 2);
    width: 0;
    height: 0;
    border-top: solid calc($bubble-height / 2) transparent;
    border-left: solid calc($bubble-height / 2);
    border-bottom: solid calc($bubble-height / 2) transparent;
  }

  &.min{
    bottom: binded-bottom(v-bind(minUpright), $bubble-height);
  }
  &.max{
    bottom: binded-bottom(v-bind(maxUpright), $bubble-height);
  }

  &.light {
    $bg-color: #dbdbdb;
    background-color: $bg-color;
    color: #212121;
    &::before {
      border-left-color: $bg-color;
    }
  }
  &.dark {
    $bg-color: #2a2a2a;
    background-color: $bg-color;
    color: #fff;
    &::before {
      border-left-color: $bg-color;
    }
  }
}

// 表示状態の管理
.upright-indicator::before {
  visibility: v-bind(pointerDisplay);
}

.upright-threshold-bubble.min,
.upright-indicator__threshold-area::before {
  visibility: v-bind(minThresholdDisplay);
}

.upright-threshold-bubble.max,
.upright-indicator__threshold-area::after {
  visibility: v-bind(maxThresholdDisplay);
}
</style>
