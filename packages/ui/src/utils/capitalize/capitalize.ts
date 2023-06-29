/**
 * Capitalizes the first letter of a string
 * @param str The string to capitalize
 */
export const capitalize = (str: string) =>
  str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
