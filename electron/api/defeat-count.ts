let defeatCount = 0;

export const getDefeatCount = () => defeatCount;
export const incrementDefeatCount = () => ++defeatCount;
export const decrementDefeatCount = () => defeatCount >= 1 ? --defeatCount : defeatCount;
