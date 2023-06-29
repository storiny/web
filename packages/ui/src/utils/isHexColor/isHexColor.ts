/**
 * Predicate function for determining a valid hex color string
 * @see Regex from https://github.com/regexhq/hex-color-regex
 * @param input The input hex color string to test against
 */
export const isHexColor = (input: string): boolean =>
  /^#([a-f0-9]{3,4}|[a-f0-9]{4}(?:[a-f0-9]{2}){1,2})\b$/i.test(input);
