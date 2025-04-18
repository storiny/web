/**
 * Parses a position string (percentage or pixel value) and calculates the corresponding numeric value.
 * @param position The position as a string, either percentage or pixel value.
 * @param relative_num The reference number to calculate the relative position from.
 */
export const parse_position = ({
  position,
  relative_num
}: {
  position: string;
  relative_num: number;
}): number => {
  const position_val = parseFloat(position);

  return position.endsWith("%")
    ? (relative_num * position_val) / 100
    : position_val;
};
