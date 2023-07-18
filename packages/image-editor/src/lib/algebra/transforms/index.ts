import { orthogonalToLine } from "../directions";
import {
  add,
  Direction,
  Line,
  mul,
  normalized,
  Point,
  reverse,
  Transform
} from "../geom";

/**
 * rotate
 * @param pivot Pivot
 * @param angle Angle
 */
export const rotation = (pivot: Point, angle: number): Transform =>
  add(mul(pivot, Math.sin(angle / 2)), Math.cos(angle / 2));

/**
 * translation
 * @param direction Direction
 */
export const translation = (direction: Direction): Transform => [
  1,
  0,
  0,
  0,
  -(0.5 * direction[5]),
  0.5 * direction[4],
  0,
  0
];

/**
 * translationOrthogonal
 * @param direction Direction
 * @param distance Distance
 */
export const translationOrthogonal = (
  direction: Direction,
  distance: number
): Transform => {
  const scale = 0.5 * distance;
  return [1, 0, 0, 0, scale * direction[4], scale * direction[5], 0, 0];
};

/**
 * translationAlong
 * @param line Line
 * @param distance Distance
 */
export const translationAlong = (line: Line, distance: number): Transform =>
  add(mul(orthogonalToLine(line), 0.5 * distance), 1);

/**
 * compose
 * @param motor1 Transform
 * @param motor2 Another transform
 */
export const compose = (motor1: Transform, motor2: Transform): Transform =>
  mul(motor2, motor1);

/**
 * apply
 * @param motor Transform
 * @param nvector NVector
 */
export const apply = (
  motor: Transform,
  nvector: Point | Direction | Line
): Point | Direction | Line =>
  normalized(mul(mul(motor, nvector), reverse(motor)));
