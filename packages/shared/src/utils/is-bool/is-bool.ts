/**
 * Predicate function for validating boolean values
 * @param value Value to check
 */
export const is_bool = (value?: boolean): value is boolean =>
  typeof value === "boolean";
