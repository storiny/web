/**
 * Returns 2d distance between two line segments
 * @param x1 X1
 * @param y1 Y1
 * @param x2 X2
 * @param y2 Y2
 */
export const distance2d = (
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number => {
  const xd = x2 - x1;
  const yd = y2 - y1;
  return Math.hypot(xd, yd);
};
