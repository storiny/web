const RGBA_COMMA_MATCHER =
  /rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,?\s*(\d{1,3})\s*(,\s*\d*\.\d*\s*)?\)/i;

const RGBA_SPACE_MATCHER =
  /rgba?\(\s*(\d{1,3})\s*(\d{1,3})\s*(\d{1,3})\s*(\/?\s*\d+%)?(\/\s*\d+\.\d\s*)?\)/i;

/**
 * Predicate function for determining RGB(A) color strings
 * @param value Color value
 */
export const is_rgba_color = (value: string): boolean =>
  RGBA_COMMA_MATCHER.test(value) || RGBA_SPACE_MATCHER.test(value);
