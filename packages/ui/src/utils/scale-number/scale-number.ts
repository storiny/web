/**
 * Returns a function to scale between two different number ranges
 * @param old_min Old minimum range
 * @param old_max Old maximum range
 * @param new_min New minimum range
 * @param new_max New maximum range
 */
export const scale_number =
  (
    old_min: number,
    old_max: number,
    new_min: number,
    new_max: number
  ): ((value: number) => number) =>
  (value: number) =>
    ((value - old_min) * (new_max - new_min)) / (old_max - old_min) + new_min;
