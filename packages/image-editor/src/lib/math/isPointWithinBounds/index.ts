import { Point } from "../../../types";

/**
 * Predicate function for determining whether `q` lies inside the segment/rectangle defined by `p` and `r`.
 * This is an approximation to "does `q` lie on a segment `pr`" check
 * @param p Point
 * @param q Point
 * @param r Point
 */
export const isPointWithinBounds = (p: Point, q: Point, r: Point): boolean =>
  q[0] <= Math.max(p[0], r[0]) &&
  q[0] >= Math.min(p[0], r[0]) &&
  q[1] <= Math.max(p[1], r[1]) &&
  q[1] >= Math.min(p[1], r[1]);
