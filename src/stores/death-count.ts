import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useDeathCountStore = defineStore('death-count', () => {
  const count = ref(0);

  const decrement = async () => {
    count.value = await window.osc.decrementDefeatCount();
  };

  const getDeathCount = async () => {
    count.value = await window.osc.getDefeatCount();
  };

  (async () => {
    getDeathCount();
    window.osc.onUpdateDefeatCount((newCount) => {
      count.value = newCount;
    });
  })();

  return {
    count,
    decrement,
  };
});
