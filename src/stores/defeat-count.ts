import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useDefeatCountStore = defineStore('defeat-count', () => {
  const count = ref(0);

  const decrement = async () => {
    count.value = await window.defeatCount.decrementDefeatCount();
  };

  const getDefeatCount = async () => {
    count.value = await window.defeatCount.getDefeatCount();
  };

  (async () => {
    getDefeatCount();
    window.defeatCount.onUpdateDefeatCount((newCount) => {
      count.value = newCount;
    });
  })();

  return {
    count,
    decrement,
  };
});
