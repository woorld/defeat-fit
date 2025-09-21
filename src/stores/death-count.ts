import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useDeathCountStore = defineStore('death-count', () => {
  const count = ref(0);

  const decrement = async () => {
    count.value = await window.defeatCount.decrementDefeatCount();
  };

  const getDeathCount = async () => {
    count.value = await window.defeatCount.getDefeatCount();
  };

  (async () => {
    getDeathCount();
    window.defeatCount.onUpdateDefeatCount((newCount) => {
      count.value = newCount;
    });
  })();

  return {
    count,
    decrement,
  };
});
