<script setup lang="ts">
import { ref } from 'vue';
import type { Stats } from '../../common/types';
import ViewHeading from '../components/ViewHeading.vue';

const stats = ref<Stats[]>([]);

(async () => {
  stats.value = await window.stats.getStats();
})();
</script>

<template>
  <VContainer>
    <ViewHeading title="統計" />
    <VCard
      v-for="statsItem in stats"
    >
      <template #title>
        <span>{{ statsItem.date }}</span>
        <span class="ml-4 d-inline-flex justify-center align-center text-grey">
          <VIcon size="20">mdi-coffin</VIcon>
          {{ statsItem.defeatCount }}
        </span>
      </template>
      <template #text>
        <VTable density="compact">
          <tbody>
            <tr v-for="menuItem of statsItem.menu">
              <td>{{ menuItem.name }}</td>
              <td>{{ menuItem.count }} {{ menuItem.unit }}</td>
            </tr>
          </tbody>
        </VTable>
      </template>
    </VCard>
  </VContainer>
</template>
