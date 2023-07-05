/**
 * Predicate function for validating numbers
 * @param value Value to validate
 */
export const isValidNum = (value: string | number | symbol): value is number =>
  typeof value === "number" && !isNaN(value);
