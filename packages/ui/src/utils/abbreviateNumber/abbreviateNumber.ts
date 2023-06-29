const abbreviations = ["", "k", "M", "B", "T", "P", "E"] as const;

/**
 * Abbreviates a number
 * @param a The number to abbreviate
 */
export const abbreviateNumber = (a: number): string => {
  const positive = Math.sign(a) >= 0;

  a = Math.abs(a);

  const level = (Math.log10(a) / 3) | 0;

  if (level == 0) {
    return `${!positive ? "-" : ""}${a}`;
  }

  const abbreviation = abbreviations[level];

  if (!abbreviation) {
    throw new RangeError("Number out of range");
  }

  const result = String(Number((a / Math.pow(10, level * 3)).toFixed(1)));

  return `${!positive ? "-" : ""}${result}${abbreviation}`;
};
