/**
 * Parses and returns the valid month
 * @param value The month value
 */
export const get_valid_month = (value = ""): number | undefined => {
  const month = Number.parseInt(value);

  if (month > 0 && month <= 12) {
    return month;
  }

  return undefined;
};
