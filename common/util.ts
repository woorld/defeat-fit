import type { MenuUnit } from '@prisma-generated-client';

export const menuUnitMap: Record<MenuUnit, string> = {
  COUNT: '回',
  SECOND: '秒',
};

const calcRawMenuAmount = (multiplier: number, defeatCount: number) => Math.ceil(multiplier * defeatCount);

export const calcMenuAmount = (multiplier: number, defeatCount: number, maxValue: number) => {
  const amount = calcRawMenuAmount(multiplier, defeatCount);
  return maxValue > 0 ? Math.min(amount, maxValue) : amount;
};

export const isMenuAmountCapped = (multiplier: number, defeatCount: number, maxValue: number) =>
  maxValue > 0 && calcRawMenuAmount(multiplier, defeatCount) >= maxValue;

export const getStatsDateString = (date: Date, dayBoundaryOffsetHours: number) => {
  const offsetDate = new Date(date);
  // 設定画面で設定した時間分引いて日付判定を変更
  offsetDate.setHours(offsetDate.getHours() - dayBoundaryOffsetHours);
  // YYYY-MM-DD（sv-SE=スウェーデンの標準形式）で日付を取得
  return offsetDate.toLocaleDateString('sv-SE');
};
