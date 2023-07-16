import { Point } from "../../../types";
import { rotate } from "../rotate";

/**
 * Rotates a point around a center point by the given angle
 * @param point Point to rotate
 * @param center Center point to rotate by
 * @param angle Angle to rotate by
 */
export const rotatePoint = (
  point: Point,
  center: Point,
  angle: number
): [number, number] => rotate(point[0], point[1], center[0], center[1], angle);
