import { Mutable } from "@storiny/types";

import { LinearLayer, NonDeleted, Point } from "../../../types";
import { arePointsEqual } from "../arePointsEqual";
import { getBezierXY } from "../getBezierXY";
import { getControlPointsForBezierCurve } from "../getControlPointsForBezierCurve";

/**
 * Returns points in the bézier curve
 * @param layer Linear layer
 * @param endPoint End point
 */
export const getPointsInBezierCurve = (
  layer: NonDeleted<LinearLayer>,
  endPoint: Point
): Mutable<Point>[] => {
  const controlPoints: Mutable<Point>[] = getControlPointsForBezierCurve(
    layer,
    endPoint
  )!;

  if (!controlPoints) {
    return [];
  }

  const pointsOnCurve: Mutable<Point>[] = [];
  let t = 1;

  // Take 20 points on the curve for better accuracy
  while (t > 0) {
    const point = getBezierXY(
      controlPoints[0],
      controlPoints[1],
      controlPoints[2],
      controlPoints[3],
      t
    );

    pointsOnCurve.push([point[0], point[1]]);
    t -= 0.05;
  }

  if (pointsOnCurve.length) {
    if (arePointsEqual(pointsOnCurve.at(-1)!, endPoint)) {
      pointsOnCurve.push([endPoint[0], endPoint[1]]);
    }
  }

  return pointsOnCurve;
};
