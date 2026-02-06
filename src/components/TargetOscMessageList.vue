<script setup lang="ts">
import { computed } from 'vue';
import type { TargetOscMessageSetting } from '../../common/types';
import OscMessageSelectDialog from './OscMessageSelectDialog.vue';
import ItemEmptyCard from './ItemEmptyCard.vue';

const addressValidator = [
  (v: string) => v.length >= 1,
  (v: string) => model.value.filter(s => s.address === v).length <= 1
];

const model = defineModel<TargetOscMessageSetting[]>({ required: true });

const isModelValid = computed(() => {
  for (const validator of addressValidator) {
    for (const setting of model.value) {
      if (!validator(setting.address)) {
        return false;
      }
    }
  }
  return true;
});

const addMessageBySelectDialog = (newSetting: TargetOscMessageSetting) => {
  const existsSettingIndex = model.value.findIndex((s) => s.address === newSetting.address);
  if (existsSettingIndex <= -1) {
    model.value.push(newSetting);
    return;
  }
  model.value[existsSettingIndex] = newSetting;
};
</script>

<template>
  <div>
    <VLabel class="mb-2">対象のOSCメッセージ</VLabel>
    <ItemEmptyCard v-if="model.length <= 0" itemName="OSCメッセージ" />
    <VList v-else>
      <VListItem
        v-for="setting, index of model"
        density="compact"
        :key="setting.id"
      >
        <template #prepend>
          <VListItemAction start>
            <VCheckboxBtn :model-value="setting.enabled" @update:model-value="selected => setting.enabled = selected" />
          </VListItemAction>
        </template>
        <VTextField
          v-model="setting.address"
          variant="outlined"
          density="compact"
          :rules="addressValidator"
          hide-details
        />
        <template #append>
          <VListItemAction end>
            <VBtn
              icon="mdi-close"
              variant="text"
              size="small"
              @click="model.splice(index, 1)"
            />
          </VListItemAction>
        </template>
      </VListItem>
    </VList>
    <div class="d-flex justify-center align-center ga-4 mt-4">
      <VBtn
        prepend-icon="mdi-pencil"
        rounded
        :disabled="!isModelValid"
        @click="model.push({ id: Date.now(), address: '', enabled: true })"
      >手入力で追加</VBtn>
      <VBtn
        rounded
        prepend-icon="mdi-list-box-outline"
        :disabled="!isModelValid"
      >
        一覧から追加
        <OscMessageSelectDialog
          activateByParent
          @select-message="message => addMessageBySelectDialog({ id: Date.now(), address: message, enabled: true })"
        />
      </VBtn>
    </div>
  </div>
</template>
