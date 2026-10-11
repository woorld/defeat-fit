<script setup lang="ts">
import { ref, computed, type ComponentPublicInstance } from 'vue';
import type { StatsWithMenus, TotalStats } from '@common/types';
import { menuUnitMap } from '@common/util';
import ConfirmDialog from '@src/components/common/ConfirmDialog.vue';
import { useNoticeStore } from '@src/stores/notice';
import { copyElementImage } from '@src/composables/common/copy-element-image';

// NOTE: Computedだとユーザ定義型ガードとして使えない
const isStatsWithMenus = (stats: StatsWithMenus | TotalStats): stats is StatsWithMenus =>
  'id' in stats && 'date' in stats;

const props = defineProps<{
  stats: StatsWithMenus | TotalStats,
}>();

const emit = defineEmits<{
  (e: 'delete-stats', id: number): void,
}>();

// NOTE: 画像から除外する要素のクラス（操作ボタン列）
const CAPTURE_EXCLUDE_CLASS = 'capture-exclude';

const noticeStore = useNoticeStore();

const isDeleteDialogVisible = ref(false);
const isCopying = ref(false);
const cardRef = ref<ComponentPublicInstance>();

const title = computed(() => isStatsWithMenus(props.stats) ? props.stats.date : 'Total');

const onCopyImage = async () => {
  const cardElement = cardRef.value?.$el as HTMLElement | undefined;
  if (!cardElement || isCopying.value) {
    return;
  }

  isCopying.value = true;
  try {
    await copyElementImage(cardElement, CAPTURE_EXCLUDE_CLASS);
    noticeStore.noticeList.push({ text: '統計を画像としてコピーしました', color: 'success' });
  }
  catch (e) {
    console.warn('DefeatFit: copy stats image failed: ', e);
    noticeStore.noticeList.push({ text: '統計の画像コピーに失敗しました', color: 'error' });
  }
  finally {
    isCopying.value = false;
  }
};

const onDeleteStats = () => {
  if (!isStatsWithMenus(props.stats)) {
    return;
  }
  emit('delete-stats', props.stats.id);
  isDeleteDialogVisible.value = false;
};
</script>

<template>
  <VCard ref="cardRef" class="mb-6 py-2" border>
    <template #text>
      <div class="d-flex justify-space-between align-center ga-4">
        <div class="w-25 text-center">
          <span class="text-h6">{{ title }}</span>
          <div class="text-h4 d-flex justify-center align-center mt-3">
            <VIcon>mdi-coffin</VIcon>
            <!-- NOTE: marginはアイコンの余白に合わせるためのもの -->
            <div class="mx-2 mb-1">{{ props.stats.defeatCount }}</div>
          </div>
        </div>
        <VDivider
          class="mr-3"
          vertical
          inset
        />
        <div class="flex-1-1-0">
          <template v-if="props.stats.statsMenuList.length <= 0">メニューはありません</template>
          <VTable v-else density="compact">
            <tbody>
              <tr v-for="statsMenu of props.stats.statsMenuList">
                <td>{{ statsMenu.menu?.name }}</td>
                <td class="text-right">{{ statsMenu.count }} {{ menuUnitMap[statsMenu.menu?.unit || 'COUNT'] }}</td>
              </tr>
            </tbody>
          </VTable>
        </div>
        <div
          class="d-flex flex-column flex-0-1-1"
          :class="CAPTURE_EXCLUDE_CLASS"
        >
          <VBtn
            icon="mdi-content-copy"
            elevation="0"
            :rounded="false"
            :disabled="isCopying"
            @click="onCopyImage"
          />
          <VBtn
            v-if="isStatsWithMenus(props.stats)"
            class="text-red"
            icon="mdi-trash-can"
            elevation="0"
            :rounded="false"
            @click="isDeleteDialogVisible = true"
          />
        </div>
      </div>
    </template>
  </VCard>
  <ConfirmDialog
    v-model="isDeleteDialogVisible"
    title="統計の削除"
    yesBtnColor="red"
    reverseYesNoPosition
    @click-yes="onDeleteStats"
    @click-no="isDeleteDialogVisible = false"
  >
    本当に {{ title }} の統計を削除しますか？
  </ConfirmDialog>
</template>
