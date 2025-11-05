<script setup lang="ts">
import { ref } from 'vue';
import { useDefeatCountStore } from '../stores/defeat-count';
import DecrementBtn from '../components/DecrementBtn.vue';
import OscControlBtn from '../components/OscControlBtn.vue';
import DoMenuBtn from '../components/DoMenuBtn.vue';
import type { Menu } from '../../prisma/generated/client';
import DoneBtn from '../components/DoneBtn.vue';
import CautionDialog from '../components/CautionDialog.vue';
import { menuUnitMap } from '../../common/util';

const defeatCount = useDefeatCountStore();

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
      <span class="ml-3 text-h3 mb-2">{{ defeatCount.count }}</span>
    </div>
    <h2 class="text-center text-h5 mb-4">- 本日のメニュー -</h2>
    <VTable hover>
      <tbody>
        <tr v-for="menu of menuList">
          <td>{{ menu.name }}</td>
          <td>× {{ menu.multiplier }} {{ menuUnitMap[menu.unit] }}</td>
          <td class="text-right">
            <span
              class="pt-1 pb-1 pr-2 pl-2 rounded"
            >{{ Math.ceil(menu.multiplier * defeatCount.count) }} {{ menuUnitMap[menu.unit] }}</span>
          </td>
          <td class="text-right">
            <DoMenuBtn :menu />
          </td>
        </tr>
      </tbody>
    </VTable>
    <div class="w-100 mt-8 d-flex justify-center align-center ga-4">
      <DecrementBtn class="flex-1-1-0" />
      <DoneBtn class="flex-1-1-0" :menuList="menuList" />
    </div>
    <OscControlBtn />
    <CautionDialog />
  </VContainer>
</template>
