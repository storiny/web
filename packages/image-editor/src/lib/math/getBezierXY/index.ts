import { Point } from "../../../types";

/**
 * Returns bezier X and Y coordinates
 * @param p0
 * @param p1
 * @param p2
 * @param p3
 * @param t
 */
export const getBezierXY = (
  p0: Point,
  p1: Point,
  p2: Point,
  p3: Point,
  t: number
): [number, number] => {
  const equation = (t: number, idx: number): number =>
    Math.pow(1 - t, 3) * p3[idx] +
    3 * t * Math.pow(1 - t, 2) * p2[idx] +
    3 * Math.pow(t, 2) * (1 - t) * p1[idx] +
    p0[idx] * Math.pow(t, 3);
  const tx = equation(t, 0);
  const ty = equation(t, 1);

  return [tx, ty];
};
