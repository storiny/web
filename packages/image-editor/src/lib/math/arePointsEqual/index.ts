import { Point } from "../../../types";

/**
 * Predicate function for determining equal points
 * @param p1 Point
 * @param p2 Another point
 */
export const arePointsEqual = (p1: Point, p2: Point): boolean =>
  p1[0] === p2[0] && p1[1] === p2[1];
