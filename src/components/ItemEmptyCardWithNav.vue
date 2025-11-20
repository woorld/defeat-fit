<script setup lang="ts">
const props = defineProps<{
  title: string,
  text: string,
  showPresetNav?: boolean,
}>();
</script>

<template>
  <VCard>
    <div class="text-center py-2">
      <VCardTitle>{{ props.title }}</VCardTitle>
      <VCardText>{{ props.text }}</VCardText>
    </div>
    <VDivider />
    <VList lines="two">
      <VListItem
        title="メニュー"
        subtitle="行う種目（腕立て伏せ、プランクなど）"
      >
        <template #append>
          <VBtn
            to="/menu/edit"
            append-icon="mdi-chevron-right"
            color="green"
          >メニューを編集</VBtn>
        </template>
      </VListItem>
      <VListItem
        v-if="props.showPresetNav"
        title="プリセット"
        subtitle="どのメニューを行うか、一敗あたり何回行うかの設定"
      >
        <template #append>
          <VBtn
            to="/menu/preset"
            append-icon="mdi-chevron-right"
            color="green"
          >プリセットを追加</VBtn>
        </template>
      </VListItem>
    </VList>
  </VCard>
</template>
