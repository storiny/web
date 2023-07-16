import { Point } from "../../../types";

/**
 * For the ordered points p, q, r, returns 0 if p, q, r are colinear,
 * 1 if clockwise, and 2 if counter-clockwise
 * @param p Point
 * @param q Point
 * @param r Point
 */
export const orderedColinearOrientation = (
  p: Point,
  q: Point,
  r: Point
): number => {
  const val = (q[1] - p[1]) * (r[0] - q[0]) - (q[0] - p[0]) * (r[1] - q[1]);

  if (val === 0) {
    return 0;
  }

  return val > 0 ? 1 : 2;
};
