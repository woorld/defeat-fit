import { ref } from 'vue';

// NOTE: 全ての統計カードで共有する。いずれかのカードがコピー中（クールダウン含む）の間は、他のカードのコピーも受け付けない
export const isStatsCopyBusy = ref(false);
