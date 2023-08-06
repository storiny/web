/**
 * Returns dotted dash array
 * @param strokeWidth Stroke width
 */
export const getDottedDashArray = (strokeWidth: number): [number, number] => [
  1.5,
  6 + strokeWidth
];
