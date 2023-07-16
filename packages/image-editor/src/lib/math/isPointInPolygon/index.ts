import { Point } from "../../../types";
import { doSegmentsIntersect } from "../doSegmentsIntersect";
import { isPointWithinBounds } from "../isPointWithinBounds";
import { orderedColinearOrientation } from "../orderedColinearOrientation";

/**
 * Prediate function for determining whether a point lies in the polygon
 * @param points Points
 * @param x X coordinate
 * @param y Y coordinate
 */
export const isPointInPolygon = (
  points: Point[],
  x: number,
  y: number
): boolean => {
  const vertices = points.length;

  // There must be at least 3 vertices in polygon
  if (vertices < 3) {
    return false;
  }

  const extreme: Point = [Number.MAX_SAFE_INTEGER, y];
  const p: Point = [x, y];
  let count = 0;

  for (let i = 0; i < vertices; i++) {
    const current = points[i];
    const next = points[(i + 1) % vertices];

    if (doSegmentsIntersect(current, next, p, extreme)) {
      if (orderedColinearOrientation(current, p, next) === 0) {
        return isPointWithinBounds(current, p, next);
      }

      count++;
    }
  }

  // `true` if the count is off
  return count % 2 === 1;
};
