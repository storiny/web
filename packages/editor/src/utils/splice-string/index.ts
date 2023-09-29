/**
 * Splices a string
 * @param str String
 * @param index Index
 * @param del_count Delete count
 * @param next_text Next text
 */
export const splice_string = (
  str: string,
  index: number,
  del_count: number,
  next_text: string
): string => str.slice(0, index) + next_text + str.slice(index + del_count);
