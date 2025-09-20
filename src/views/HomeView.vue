<script setup lang="ts">
import { ref } from 'vue';
import { useDeathCountStore } from '../stores/death-count';
import DecrementBtn from '../components/DecrementBtn.vue';
import OscControlBtn from '../components/OscControlBtn.vue';
import ToTimerBtn from '../components/ToTimerBtn.vue';
import type { Menu } from '../../common/types';

const deathCount = useDeathCountStore();

const menuList = ref<Menu[]>([]);

(async () => {
  menuList.value = await window.menuList.getMenuList();
})();
</script>

<template>
  <VContainer>
    <div class="d-flex justify-center align-center mt-8 mb-13">
      <VIcon class="text-h2">mdi-coffin</VIcon>
      <span class="text-h5">×</span>
      <span class="ml-3 text-h3 mb-2">{{ deathCount.count }}</span>
    </div>
    <h2 class="text-center text-h5 mb-4">- 本日のメニュー -</h2>
    <VTable hover>
      <tbody>
        <tr v-for="menu of menuList">
          <td>{{ menu.name }}</td>
          <td>× {{ menu.multiplier }} {{ menu.unit }}</td>
          <td class="text-right">
            <span
              class="pt-1 pb-1 pr-2 pl-2 rounded"
            >{{ deathCount.count * menu.multiplier }} {{ menu.unit }}</span>
          </td>
          <td class="text-right">
            <ToTimerBtn
              v-if="menu.unit === '秒'"
              :deathCount="deathCount.count * menu.multiplier"
            />
          </td>
        </tr>
      </tbody>
    </VTable>
    <DecrementBtn />
    <OscControlBtn />
  </VContainer>
</template>
