/**
 * Returns dashed dash array
 * @param stroke_width Stroke width
 */
export const get_dashed_dash_array = (
  stroke_width: number
): [number, number] => [8, 8 + stroke_width];
