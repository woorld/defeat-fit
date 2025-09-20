<script setup lang="ts">
import BaseDialog from './BaseDialog.vue';

const props = defineProps<{
  title?: string,
  explanation: string,
  yesBtnColor: string,
  reverseYesNoPosition?: boolean,
  activateByParent?: boolean,
}>();

const emit = defineEmits<{
  (e: 'click-yes'): void,
  (e: 'click-no'): void,
}>();

const model = defineModel<boolean>({ required: true });
</script>

<template>
  <BaseDialog v-model="model" :activateByParent="props.activateByParent">
    <h3 class="text-h5 mb-8" v-show="props.title">{{ props.title }}</h3>
    <p>{{ props.explanation }}</p>
    <div class="w-100 mt-8 d-flex justify-center align-center ga-4" :class="{'flex-row-reverse': props.reverseYesNoPosition}">
      <VBtn variant="outlined" @click="emit('click-no')">いいえ</VBtn>
      <VBtn :color="props.yesBtnColor" @click="emit('click-yes')">はい</VBtn>
    </div>
  </BaseDialog>
</template>
