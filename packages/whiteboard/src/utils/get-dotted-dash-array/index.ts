/**
 * Returns dotted dash array
 * @param stroke_width Stroke width
 */
export const get_dotted_dash_array = (
  stroke_width: number
): [number, number] => [1.5, 6 + stroke_width];
