/**
 * Splices a string
 * @param str String
 * @param index Index
 * @param delCount Delete count
 * @param newText New text
 */
export const spliceString = (
  str: string,
  index: number,
  delCount: number,
  newText: string
): string => str.slice(0, index) + newText + str.slice(index + delCount);
