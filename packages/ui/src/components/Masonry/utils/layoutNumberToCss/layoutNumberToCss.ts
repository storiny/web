/**
 * Parses value from layout mechanism to a CSS value
 * @param num Layout number value
 */
export const layoutNumberToCss = (num: number): number | undefined =>
  num !== Infinity ? num : undefined;
