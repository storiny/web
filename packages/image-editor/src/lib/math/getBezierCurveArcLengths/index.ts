import { LinearLayer, NonDeleted, Point } from "../../../types";
import { distance2d } from "../distance2d";
import { getPointsInBezierCurve } from "../getPointsInBezierCurve";

/**
 * Returns the bézier curve arc lengths
 * @param layer Linear layer
 * @param endPoint End point
 */
export const getBezierCurveArcLengths = (
  layer: NonDeleted<LinearLayer>,
  endPoint: Point
): number[] => {
  const arcLengths: number[] = [];
  arcLengths[0] = 0;
  const points = getPointsInBezierCurve(layer, endPoint);
  let index = 0;
  let distance = 0;

  while (index < points.length - 1) {
    const segmentDistance = distance2d(
      points[index][0],
      points[index][1],
      points[index + 1][0],
      points[index + 1][1]
    );

    distance += segmentDistance;
    arcLengths.push(distance);
    index++;
  }

  return arcLengths;
};
