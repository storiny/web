import { is_num } from "@storiny/shared/src/utils/is-num";

/**
 * Predicate function for validation integral color values
 * @param value Color value
 * @param max Upper bound
 * @param min Lower bound
 */
export const is_valid_color = (
  value: string | number | symbol,
  max: number,
  min = 0
): boolean => is_num(value) && value >= min && value <= max;
