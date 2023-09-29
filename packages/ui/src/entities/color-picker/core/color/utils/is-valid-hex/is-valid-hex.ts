/**
 * Predicate function for determining a partial hex color strings
 * @param hex Partial input hex
 */
export const is_valid_hex = (hex: string): boolean =>
  /(^#{0,1}[0-9A-F]{6}$)|(^#{0,1}[0-9A-F]{3}$)/i.test(hex);
