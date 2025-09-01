<script setup lang="ts">
import { ref } from 'vue';

type Menu = {
  name: string,
  multiplier: number,
  unit: '回' | '秒',
}

const menuList = ref<Menu[]>([]);

(async () => {
  menuList.value = await window.osc.getMenuList();
})();
</script>

<template>
  <VContainer class="h-100">
    <VTable :items="menuList">
      <tbody>
        <tr class="font-weight-bold">
          <td>メニュー名</td>
          <td>回・秒 / 死</td>
          <td>単位</td>
          <td></td>
        </tr>
        <tr v-for="menu of menuList">
          <td>{{ menu.name }}</td>
          <td>{{ menu.multiplier }}</td>
          <td>{{ menu.unit }}</td>
          <td class="text-right">
            <VBtn
              size="small"
              elevation="0"
              icon="mdi-pencil"
            />
            <VBtn
              class="text-red"
              size="small"
              elevation="0"
              icon="mdi-close"
            />
          </td>
        </tr>
      </tbody>
    </VTable>
    <VBtn icon="mdi-plus" class="w-100" :rounded="false" color="transparent" elevation="0">
    </VBtn>
  </VContainer>
</template>
