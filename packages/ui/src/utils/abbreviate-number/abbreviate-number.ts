const ABBREVIATIONS = ["", "k", "M", "B", "T", "P", "E"] as const;

/**
 * Abbreviates a number
 * @param num Number to abbreviate
 */
export const abbreviate_number = (num = 0): string => {
  const positive = Math.sign(num) >= 0;
  num = Math.abs(num);
  const level = (Math.log10(num) / 3) | 0;

  if (level == 0) {
    return `${!positive ? "-" : ""}${num}`;
  }

  const abbreviation = ABBREVIATIONS[level];

  if (!abbreviation) {
    throw new RangeError("Number out of range");
  }

  const result = String(Number((num / Math.pow(10, level * 3)).toFixed(1)));

  return `${!positive ? "-" : ""}${result}${abbreviation}`;
};
