import { Op } from "roughjs/bin/core";

import { Point } from "../../../../types";
import { Bounds } from "../types";

type MaybeQuadraticSolution = [number | null, number | null] | false;

/**
 * Computes the bezier value
 * @see https://eliot-jones.com/2019/12/cubic-bezier-curve-bounding-boxes
 * @param t
 * @param p0
 * @param p1
 * @param p2
 * @param p3
 */
const getBezierValueForT = (
  t: number,
  p0: number,
  p1: number,
  p2: number,
  p3: number
): number => {
  const oneMinusT = 1 - t;
  return (
    Math.pow(oneMinusT, 3) * p0 +
    3 * Math.pow(oneMinusT, 2) * t * p1 +
    3 * oneMinusT * Math.pow(t, 2) * p2 +
    Math.pow(t, 3) * p3
  );
};

/**
 * Tries to compute the result of a quadratic equation
 * @param p0
 * @param p1
 * @param p2
 * @param p3
 */
const solveQuadratic = (
  p0: number,
  p1: number,
  p2: number,
  p3: number
): MaybeQuadraticSolution => {
  const i = p1 - p0;
  const j = p2 - p1;
  const k = p3 - p2;
  const a = 3 * i - 6 * j + 3 * k;
  const b = 6 * j - 6 * i;
  const c = 3 * i;
  const sqrtPart = b * b - 4 * a * c;
  const hasSolution = sqrtPart >= 0;

  if (!hasSolution) {
    return false;
  }

  let s1 = null;
  let s2 = null;

  let t1: number;
  let t2: number;

  if (a === 0) {
    t1 = t2 = -c / b;
  } else {
    t1 = (-b + Math.sqrt(sqrtPart)) / (2 * a);
    t2 = (-b - Math.sqrt(sqrtPart)) / (2 * a);
  }

  if (t1 >= 0 && t1 <= 1) {
    s1 = getBezierValueForT(t1, p0, p1, p2, p3);
  }

  if (t2 >= 0 && t2 <= 1) {
    s2 = getBezierValueForT(t2, p0, p1, p2, p3);
  }

  return [s1, s2];
};

/**
 * Returns the cubic bézier curve bound
 * @param p0
 * @param p1
 * @param p2
 * @param p3
 */
const getCubicBezierCurveBound = (
  p0: Point,
  p1: Point,
  p2: Point,
  p3: Point
): Bounds => {
  const solX = solveQuadratic(p0[0], p1[0], p2[0], p3[0]);
  const solY = solveQuadratic(p0[1], p1[1], p2[1], p3[1]);
  let minX = Math.min(p0[0], p3[0]);
  let maxX = Math.max(p0[0], p3[0]);

  if (solX) {
    const xs = solX.filter((x) => x !== null) as number[];
    minX = Math.min(minX, ...xs);
    maxX = Math.max(maxX, ...xs);
  }

  let minY = Math.min(p0[1], p3[1]);
  let maxY = Math.max(p0[1], p3[1]);

  if (solY) {
    const ys = solY.filter((y) => y !== null) as number[];
    minY = Math.min(minY, ...ys);
    maxY = Math.max(maxY, ...ys);
  }

  return [minX, minY, maxX, maxY];
};

/**
 * Returns the minimum and maximum X and Y coordinate values from curve path ops
 * @param ops Operations
 * @param transformXY Transformation
 */
export const getMinMaxXYFromCurvePathOps = (
  ops: Op[],
  transformXY?: (x: number, y: number) => [number, number]
): [number, number, number, number] => {
  let currentP: Point = [0, 0];

  const { minX, minY, maxX, maxY } = ops.reduce(
    (limits, { op, data }) => {
      // There are only four operation types:
      // move, bcurveTo, lineTo, and curveTo
      if (op === "move") {
        // Change starting point
        currentP = data as unknown as Point;
        // Move operation does not draw anything; so, it always
        // returns false
      } else if (op === "bcurveTo") {
        const _p1 = [data[0], data[1]] as Point;
        const _p2 = [data[2], data[3]] as Point;
        const _p3 = [data[4], data[5]] as Point;

        const p1 = transformXY ? transformXY(..._p1) : _p1;
        const p2 = transformXY ? transformXY(..._p2) : _p2;
        const p3 = transformXY ? transformXY(..._p3) : _p3;

        const p0 = transformXY ? transformXY(...currentP) : currentP;
        currentP = _p3;

        const [minX, minY, maxX, maxY] = getCubicBezierCurveBound(
          p0,
          p1,
          p2,
          p3
        );

        limits.minX = Math.min(limits.minX, minX);
        limits.minY = Math.min(limits.minY, minY);

        limits.maxX = Math.max(limits.maxX, maxX);
        limits.maxY = Math.max(limits.maxY, maxY);
      } else if (op === "lineTo") {
        // TODO: Implement this
      } else if (op === "qcurveTo") {
        // TODO: Implement this
      }

      return limits;
    },
    { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity }
  );

  return [minX, minY, maxX, maxY];
};
