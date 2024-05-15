/**
 * Parses and returns the valid year
 * @param value The year value
 */
export const get_valid_year = (value = ""): number | undefined => {
  const year = Number.parseInt(value);

  if (year > 1000 && year < 5000) {
    return year;
  }

  return undefined;
};
