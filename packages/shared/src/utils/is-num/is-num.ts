/**
 * Predicate function for validating numbers
 * @param value Value to check
 */
export const is_num = (value?: number | string | null): value is number =>
  typeof value === "number";
