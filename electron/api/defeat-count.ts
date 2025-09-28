let defeatCount = 0;

export const defeatCountApi = {
  getDefeatCount() {
    return defeatCount;
  },

  incrementDefeatCount() {
    return ++defeatCount;
  },

  decrementDefeatCount() {
    return defeatCount >= 1 ? --defeatCount : defeatCount;
  },

  resetDefeatCount() {
    defeatCount = 0;
  },
} as const;
