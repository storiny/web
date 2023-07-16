import { Point } from "../../../types";

/**
 * Returns the center point of two points
 * @param a Point
 * @param b Another point
 */
export const centerPoint = (a: Point, b: Point): Point => [
  (a[0] + b[0]) / 2,
  (a[1] + b[1]) / 2
];
