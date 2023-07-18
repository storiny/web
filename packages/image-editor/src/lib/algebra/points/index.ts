import { join, joinScalar, Line, meet, norm, normalized, Point } from "../geom";
import { orthogonalLine } from "../lines";

/**
 * from
 * @param x X
 * @param y Y
 */
export const from = ([x, y]: readonly [number, number]): Point => [
  0,
  0,
  0,
  0,
  y,
  x,
  1,
  0
];

/**
 * toTuple
 * @param point Point
 */
export const toTuple = (point: Point): [number, number] => [point[5], point[4]];

/**
 * abs
 * @param point Point
 */
export const abs = (point: Point): Point => [
  0,
  0,
  0,
  0,
  Math.abs(point[4]),
  Math.abs(point[5]),
  1,
  0
];

/**
 * intersect
 * @param line1 Line
 * @param line2 Another line
 */
export const intersect = (line1: Line, line2: Line): Point =>
  normalized(meet(line1, line2));

/**
 * Projects `point` onto the `line`. The returned point is the closest
 * point on the `line` to the `point`
 * @param point Point
 * @param line Line
 */
export const project = (point: Point, line: Line): Point =>
  intersect(orthogonalLine(line, point), line);

/**
 * distace
 * @param point1 Point
 * @param point2 Another point
 */
export const distancePoint = (point1: Point, point2: Point): number =>
  norm(join(point1, point2));

/**
 * distanceToLine
 * @param point Point
 * @param line Line
 */
export const distanceToLine = (point: Point, line: Line): number =>
  joinScalar(point, line);
