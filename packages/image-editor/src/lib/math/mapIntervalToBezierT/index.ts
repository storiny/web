import { LinearLayer, NonDeleted, Point } from "../../../types";
import { getBezierCurveArcLengths } from "../getBezierCurveArcLengths";

/**
 * Maps interval to actual inverval `t` on the curve so that when t = 0.5,
 * it is actually the point at 50% of the length
 * @param layer Linear layer
 * @param endPoint End point
 * @param interval Interval, between 0 and 1 for which we want to find
 * the point on the curve
 */
export const mapIntervalToBezierT = (
  layer: NonDeleted<LinearLayer>,
  endPoint: Point,
  interval: number
): number => {
  const arcLengths = getBezierCurveArcLengths(layer, endPoint);
  const pointsCount = arcLengths.length - 1;
  const curveLength = arcLengths.at(-1) as number;
  const targetLength = interval * curveLength;
  let low = 0;
  let high = pointsCount;
  let index = 0;

  // Doing a binary search to find the largest length that is less than the target length
  while (low < high) {
    index = Math.floor(low + (high - low) / 2);

    if (arcLengths[index] < targetLength) {
      low = index + 1;
    } else {
      high = index;
    }
  }

  if (arcLengths[index] > targetLength) {
    index--;
  }

  if (arcLengths[index] === targetLength) {
    return index / pointsCount;
  }

  return (
    1 -
    (index +
      (targetLength - arcLengths[index]) /
        (arcLengths[index + 1] - arcLengths[index])) /
      pointsCount
  );
};
