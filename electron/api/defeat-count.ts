let defeatCount = 0;

export const defeatCountApi = {
  getDefeatCount: () => defeatCount,
  incrementDefeatCount: () => ++defeatCount,
  decrementDefeatCount: () => defeatCount >= 1 ? --defeatCount : defeatCount,
} as const;
