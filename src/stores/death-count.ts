import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useDeathCountStore = defineStore('death-count', () => {
  const count = ref(0);

  const decrement = async () => {
    count.value = await window.osc.decrementDeathCount();
  };

  const getDeathCount = async () => {
    count.value = await window.osc.getDeathCount();
  };

  (async () => {
    getDeathCount();
    window.osc.onUpdateDeathCount((newCount) => {
      count.value = newCount;
    });
  })();

  return {
    count,
    decrement,
  };
});
