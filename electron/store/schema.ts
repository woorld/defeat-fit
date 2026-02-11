type Overwrite<T, U extends { [K in keyof T]?: unknown }> = Omit<T, keyof U> & U;

// NOTE: マイグレーション時は以前のスキーマを SchemaVnum に改名し、最新のスキーマを Schema として定義
export type SchemaV1 = {
  setting: {
    targetOscMessage: string,
    soundVolume: number,
    breakTimeSecBetweenSets: number,
    showCautionDialog: boolean,
    dayBoundaryOffsetHours: number,
    lastSelectedPresetId: number | null,
    colorTheme: 'light' | 'dark' | 'system',
  },
};

export type Schema = Overwrite<
  SchemaV1,
  {
    SCHEMA_VERSION: number,
    setting: Overwrite<SchemaV1['setting'], {
      targetOscMessage: {
        id: number,
        address: string,
        enabled: boolean,
      }[],
      oscReceivedSound: null | 'slash' | 'pull' | 'explode' | 'bell-small' | 'bell-large' | 'shoot' | 'hit',
    }>
  }
>;
