/**
 * Clamps an unbounded integral value to the specified range
 * @param min - Lower bound
 * @param value - Un-clamped value
 * @param max - Upper bound
 */
export const clamp = (min: number, value: number, max: number): number =>
  Math.min(Math.max(value, min), max);
