<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useOscStore } from '@src/stores/osc';
import { isOverlayWindow } from '@src/composables/common/window-type';

const route = useRoute();
const oscStore = useOscStore();

const isPinned = ref(true);

const togglePinned = () => {
  isPinned.value = !isPinned.value;
  window.overlay.setPinned(isPinned.value);
};

if (isOverlayWindow) {
  (async () => {
    isPinned.value = await window.overlay.isPinned();
  })();
}

const isInTimerCounterView = computed(() => route.path.startsWith('/timer-counter'));
const isInMenuView = computed(() => route.path.startsWith('/menu'));
</script>

<template>
  <VBottomNavigation>
    <VBtn to="/">
      <VIcon>mdi-home</VIcon>
    </VBtn>
    <VBtn to="/timer-counter/timer/0/1" :active="isInTimerCounterView">
      <VIcon>mdi-timer</VIcon>
    </VBtn>
    <VBtn to="/menu/edit" :active="isInMenuView">
      <VIcon>mdi-menu</VIcon>
    </VBtn>
    <VBtn to="/stats">
      <VIcon>mdi-chart-bar</VIcon>
    </VBtn>
    <VBtn to="/setting" :disabled="oscStore.oscStatus === 'PENDING'">
      <VIcon>mdi-cog</VIcon>
    </VBtn>
    <VBtn to="/about">
      <VIcon>mdi-information</VIcon>
    </VBtn>
    <VBtn v-if="isOverlayWindow" :active="false" @click="togglePinned">
      <VIcon>{{ isPinned ? 'mdi-pin' : 'mdi-pin-off' }}</VIcon>
      <VTooltip activator="parent" location="top">
        ダッシュボードを閉じても左手に表示{{ isPinned ? '中' : 'しない' }}
      </VTooltip>
    </VBtn>
  </VBottomNavigation>
</template>
