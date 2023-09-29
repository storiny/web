/**
 * Predicate function for determining valid numbers
 * @param value Value to check
 */
export const is_num = (
  value?: number | string | symbol | null
): value is number => typeof value === "number" && !isNaN(value);
