/**
 * Parses value from layout mechanism to a CSS value
 * @param num Layout number value
 */
export const layout_number_to_css = (num: number): number | undefined =>
  num !== Infinity ? num : undefined;
