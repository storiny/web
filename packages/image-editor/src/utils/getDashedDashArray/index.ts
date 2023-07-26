/**
 * Returns dashed dash array
 * @param strokeWidth Stroke width
 */
export const getDashedDashArray = (strokeWidth: number): [number, number] => [
  8,
  8 + strokeWidth
];
