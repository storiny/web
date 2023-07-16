/**
 * Rotates a line segment by the specified angle
 * @see https://math.stackexchange.com/questions/2204520/how-do-i-rotate-a-line-segment-in-a-specific-point-on-the-line
 * @param x1 X1
 * @param y1 Y1
 * @param x2 X2
 * @param y2 Y2
 * @param angle Angle to rotate by
 */
export const rotate = (
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  angle: number
): [number, number] => [
  (x1 - x2) * Math.cos(angle) - (y1 - y2) * Math.sin(angle) + x2,
  (x1 - x2) * Math.sin(angle) + (y1 - y2) * Math.cos(angle) + y2
];
