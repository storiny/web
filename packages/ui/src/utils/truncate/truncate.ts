/**
 * Truncates a string to a fixed length
 * @param str The string to truncate
 * @param max The maximum length of the string
 * @param delimiter The delimiter suffixed at the end of the string if it is truncated
 */
export const truncate = (
  str: string = "",
  max: number,
  delimiter: string = "…"
): string => (str.length > max ? str.substring(0, max - 1) + delimiter : str);
