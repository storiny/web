export interface Dimension {
  height: number;
  width: number;
}

export const DEFAULT_DIMENSION: Dimension = { height: 0, width: 0 };
export const MIN_DIMENSION = 1;
export const MAX_DIMENSION = 8192;
