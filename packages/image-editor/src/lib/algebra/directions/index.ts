import { Direction, I, inormalized, Line, mul, Point } from "../geom";

/**
 * A direction is stored as an array `[0, 0, 0, 0, y, x, 0, 0]` representing
 * vector `(x, y)`.
 */

/**
 * fromDirection
 * @param point Point
 */
export const fromDirection = (point: Point): Point => [
  0,
  0,
  0,
  0,
  point[4],
  point[5],
  0,
  0
];

/**
 * fromTo
 * @param from From
 * @param to To
 */
export const fromTo = (from: Point, to: Point): Direction =>
  inormalized([0, 0, 0, 0, to[4] - from[4], to[5] - from[5], 0, 0]);

/**
 * orthogonal
 * @param direction Directional
 */
export const orthogonal = (direction: Direction): Direction =>
  inormalized([0, 0, 0, 0, -direction[5], direction[4], 0, 0]);

/**
 * orthogonalToLine
 * @param line Line
 */
export const orthogonalToLine = (line: Line): Direction => mul(line, I);
