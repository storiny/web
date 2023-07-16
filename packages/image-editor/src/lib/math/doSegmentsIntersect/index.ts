import { Point } from "../../../types";
import { isPointWithinBounds } from "../isPointWithinBounds";
import { orderedColinearOrientation } from "../orderedColinearOrientation";

/**
 * Predicate function for determining if p1q1 intersects with p2q2
 * @param p1 Point
 * @param q1 Point
 * @param p2 Point
 * @param q2 Point
 */
export const doSegmentsIntersect = (
  p1: Point,
  q1: Point,
  p2: Point,
  q2: Point
): boolean => {
  const o1 = orderedColinearOrientation(p1, q1, p2);
  const o2 = orderedColinearOrientation(p1, q1, q2);
  const o3 = orderedColinearOrientation(p2, q2, p1);
  const o4 = orderedColinearOrientation(p2, q2, q1);

  if (o1 !== o2 && o3 !== o4) {
    return true;
  }

  // p1, q1 and p2 are colinear, and p2 lies on segment p1q1
  if (o1 === 0 && isPointWithinBounds(p1, p2, q1)) {
    return true;
  }

  // p1, q1 and p2 are colinear, and q2 lies on segment p1q1
  if (o2 === 0 && isPointWithinBounds(p1, q2, q1)) {
    return true;
  }

  // p2, q2 and p1 are colinear, and p1 lies on segment p2q2
  if (o3 === 0 && isPointWithinBounds(p2, p1, q2)) {
    return true;
  }

  // p2, q2 and q1 are colinear, and q1 lies on segment p2q2
  return o4 === 0 && isPointWithinBounds(p2, q1, q2);
};
