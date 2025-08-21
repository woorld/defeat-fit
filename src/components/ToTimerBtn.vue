<script setup lang="ts">
import { ref, computed } from 'vue';

const props = defineProps<{
  countResult: number,
}>();

const isShow = ref(false);
const setCount = ref(4);

const secondsPerSet = computed(() => Math.ceil(props.countResult / setCount.value));
</script>

<template>
  <VBtn
    append-icon="mdi-chevron-right"
    color="green"
  >
    やる
    <VDialog v-model="isShow" activator="parent">
      <VSheet class="pa-8 text-center d-flex justify-center align-center ga-6 flex-column">
        <h3 class="text-h5">セット回数設定</h3>
        <div class="d-flex justify-center align-center ga-4">
          <VNumberInput
            v-model="setCount"
            inset
            hide-details
            max-width="120"
          />
          <VIcon>mdi-arrow-right</VIcon>
          <span>
            <span class="text-h4">{{ secondsPerSet }}</span>
            <span class="text-h6 ml-2">秒</span>
          </span>
        </div>
        <VBtn
          append-icon="mdi-chevron-right"
          color="green"
          :to="`/timer/${secondsPerSet}`"
        >開始</VBtn>
      </VSheet>
      <VBtn
        class="position-absolute top-0 right-0 mt-6 mr-6 elevation-0"
        icon="mdi-close"
        @click="isShow = false"
      />
    </VDialog>
  </VBtn>
</template>
