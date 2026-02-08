<script setup lang="ts">
import type { TargetOscMessageSetting } from '../../common/types';
import OscMessageSelectDialog from './OscMessageSelectDialog.vue';
import ItemEmptyCard from './ItemEmptyCard.vue';

const addressValidator = [
  (v: string) => v.length >= 1,
  (v: string) => model.value.filter(s => s.address === v).length <= 1,
];

const model = defineModel<TargetOscMessageSetting[]>({ required: true });

const addMessage = (address: string) => {
  model.value.push({
    id: Date.now(),
    address,
    enabled: true,
  });
};
</script>

<template>
  <div>
    <VLabel class="mb-2">対象のOSCメッセージ</VLabel>
    <ItemEmptyCard v-if="model.length <= 0" itemName="OSCメッセージ" />
    <template v-else>
      <VAlert
        class="rounded-0"
        icon="mdi-alert-circle-outline"
        icon-size="24"
        density="compact"
        color="info"
      >重複や未入力、空白のみの設定は削除されます</VAlert>
      <VList>
        <VListItem
          v-for="setting, index of model"
          density="compact"
          :key="setting.id"
        >
          <template #prepend>
            <VListItemAction start>
              <VCheckboxBtn v-model="setting.enabled" />
            </VListItemAction>
          </template>
          <VTextField
            v-model="setting.address"
            variant="outlined"
            density="compact"
            :rules="addressValidator"
            placeholder="例: /avatar/parameters/BattleGimmick/Defeat"
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
    </template>
    <div class="d-flex justify-center align-center ga-4 mt-4">
      <VBtn
        prepend-icon="mdi-pencil"
        rounded
        @click="addMessage('')"
      >手入力で追加</VBtn>
      <VBtn rounded prepend-icon="mdi-format-list-bulleted">
        一覧から追加
        <OscMessageSelectDialog
          activateByParent
          @select-message="address => addMessage(address)"
        />
      </VBtn>
    </div>
  </div>
</template>
