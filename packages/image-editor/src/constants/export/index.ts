export const EXPORT_SCALES = [1, 2, 3];
export const DEFAULT_EXPORT_PADDING = 10; // px

const EXPORT_SCALE = EXPORT_SCALES.includes(devicePixelRatio)
  ? devicePixelRatio
  : 1;
