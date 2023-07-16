import { LinearLayer, NonDeleted, Point } from "../../../types";
import { getBezierCurveArcLengths } from "../getBezierCurveArcLengths";

/**
 * Returns the length of a bézier curve
 * @param layer Linear layer
 * @param endPoint End point
 */
export const getBezierCurveLength = (
  layer: NonDeleted<LinearLayer>,
  endPoint: Point
): number => {
  const arcLengths = getBezierCurveArcLengths(layer, endPoint);
  return arcLengths.at(-1) as number;
};
