import { dot, inorm, join, Line, meet, normalized, Point } from "../geom";

/**
 * A line is stored as an array `[0, c, a, b, 0, 0, 0, 0]` representing:
 * c * e0 + a * e1 + b*e2
 *
 * This maps to a standard formula `a * x + b * y + c`.
 *
 * `(-b, a)` corresponds to a 2D vector parallel to the line. The lines
 * have a natural orientation, corresponding to that vector.
 *
 * The magnitude ("norm") of the line is `sqrt(a ^ 2 + b ^ 2)`.
 * `c / norm(line)` is the oriented distance from line to origin.
 */

/**
 * Returns line with a direction (x, y) through origin
 * @param x
 * @param y
 */
export const vector = (x: number, y: number): Line =>
  normalized([0, 0, -y, x, 0, 0, 0, 0]);

/**
 * Equation ax + by + c = 0
 * @param a A
 * @param b B
 * @param c C
 */
export const equation = (a: number, b: number, c: number): Line =>
  normalized([0, c, a, b, 0, 0, 0, 0]);

/**
 * though
 * @param from From
 * @param to to
 */
export const through = (from: Point, to: Point): Line =>
  normalized(join(to, from));

/**
 * orthogonalLine
 * @param line Line
 * @param point Point
 */
export const orthogonalLine = (line: Line, point: Point): Line =>
  dot(line, point);

// Returns a line perpendicular to the line through `against` and `intersection`
// going through `intersection`.

/**
 * Returns a line perpendicular to the line through `against` and `intersection`
 * goung through `intersection`
 * @param against Against
 * @param intersection Intersection
 */
export const orthogonalThrough = (against: Point, intersection: Point): Line =>
  orthogonalLine(through(against, intersection), intersection);

/**
 * parallel
 * @param line Line
 * @param distance Distance
 */
export const parallel = (line: Line, distance: number): Line => {
  const result = line.slice();
  result[1] -= distance;

  return result as unknown as Line;
};

/**
 * parallelThrough
 * @param line Line
 * @param point Point
 */
export const parallelThrough = (line: Line, point: Point): Line =>
  orthogonalLine(orthogonalLine(point, line), point);

export const lineDistance = (line1: Line, line2: Line): number =>
  inorm(meet(line1, line2));

export const angle = (line1: Line, line2: Line): number =>
  Math.acos(dot(line1, line2)[0]);

// The orientation of the line
export const sign = (line: Line): number => Math.sign(line[1]);
