/**
 * Predicate function for determining a partial hex color strings
 * @param hex Partial input hex
 */
export const isValidHex = (hex: string): boolean =>
  /(^#{0,1}[0-9A-F]{6}$)|(^#{0,1}[0-9A-F]{3}$)/i.test(hex);
