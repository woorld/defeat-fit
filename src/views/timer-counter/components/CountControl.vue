<script setup lang="ts">

const props = defineProps<{
  isStandby: boolean,
  isBreakTime: boolean,
  isLockControl: boolean,
}>();

const count = defineModel<number>('count', { required: true });
const setCount = defineModel<number>('setCount', { required: true });
</script>

<template>
  <div class="d-flex justify-space-between align-center ga-4" v-if="!props.isLockControl">
    <VLabel>セット数</VLabel>
    <VNumberInput
      class="flex-grow-0"
      v-model="setCount"
      hide-details
      inset
      :min="1"
      :disabled="isLockControl"
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
      @click="count -= 10"
    />
    <VBtn
      icon="mdi-chevron-left"
      :disabled="count < 1 || props.isLockControl"
      @click="count -= 1"
    />
    <div class="step-count" :class="{ 'text-green': props.isBreakTime }">
      <slot />
    </div>
    <VBtn
      icon="mdi-chevron-right"
      :disabled="props.isLockControl"
      @click="count += 1"
    />
    <VBtn
      icon="mdi-chevron-double-right"
      :disabled="props.isLockControl"
      @click="count += 10"
    />
  </div>
</template>

<style scoped>
.step-count {
  width: 200px;
}
</style>
