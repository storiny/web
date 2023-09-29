/**
 * Truncates a string to a fixed length
 * @param str String to truncate
 * @param max Maximum length of the string
 * @param delimiter Delimiter suffixed at the end of the string if it is truncated
 */
export const truncate = (str = "", max: number, delimiter = "…"): string =>
  str.length > max ? str.substring(0, max - 1) + delimiter : str;
