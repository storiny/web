import { isValidNum } from "~/utils/isValidNum";

/**
 * Predicate function for validation integral color values
 * @param value Color value
 * @param max Upper bound
 * @param min Lower bound
 */
export const isValidColor = (
  value: string | number | symbol,
  max: number,
  min: number = 0
): boolean => isValidNum(value) && value >= min && value <= max;
