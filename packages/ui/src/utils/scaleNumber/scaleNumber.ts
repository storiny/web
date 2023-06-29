/**
 * Returns a function to scale between two different number ranges
 * @param oldMin Old minimum range
 * @param oldMax Old maximum range
 * @param newMin New minimum range
 * @param newMax New maximum range
 */
export const scaleNumber =
  (
    oldMin: number,
    oldMax: number,
    newMin: number,
    newMax: number
  ): ((value: number) => number) =>
  (value: number) =>
    ((value - oldMin) * (newMax - newMin)) / (oldMax - oldMin) + newMin;
