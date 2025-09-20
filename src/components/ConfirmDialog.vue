<script setup lang="ts">
import { useAttrs } from 'vue';
import BaseDialog from './BaseDialog.vue';

const attrs = useAttrs();

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

const onClickNo = () => {
  if (attrs.clickNo) {
    emit('click-no');
    return;
  }
  // 親コンポーネントで@click-noが指定されていない場合
  model.value = false;
};
</script>

<template>
  <BaseDialog v-model="model" :activateByParent="props.activateByParent">
    <h3 class="text-h5 mb-8" v-show="props.title">{{ props.title }}</h3>
    <p>{{ props.explanation }}</p>
    <div class="w-100 mt-8 d-flex justify-center align-center ga-4" :class="{'flex-row-reverse': props.reverseYesNoPosition}">
      <VBtn variant="outlined" @click="onClickNo">いいえ</VBtn>
      <VBtn :color="props.yesBtnColor" @click="emit('click-yes')">はい</VBtn>
    </div>
  </BaseDialog>
</template>
