import { Mutable } from "@storiny/types";

import { LinearLayer, NonDeleted, Point } from "../../../types";
import { getCurvePathOps } from "../../layer/bounds";
import { getShapeForLayer } from "../../renderer";
import { distance2d } from "../distance2d";

/**
 * Returns the control points for a bézier curve
 * @param layer Linear layer
 * @param endPoint End point
 */
export const getControlPointsForBezierCurve = (
  layer: NonDeleted<LinearLayer>,
  endPoint: Point
): null | Mutable<Point>[] => {
  const shape = getShapeForLayer(layer as LinearLayer);

  if (!shape) {
    return null;
  }

  const ops = getCurvePathOps(shape[0]);
  let currentP: Mutable<Point> = [0, 0];
  let index = 0;
  let minDistance = Infinity;
  let controlPoints: Mutable<Point>[] | null = null;

  while (index < ops.length) {
    const { op, data } = ops[index];

    if (op === "move") {
      currentP = data as unknown as Mutable<Point>;
    }

    if (op === "bcurveTo") {
      const p0 = currentP;
      const p1 = [data[0], data[1]] as Mutable<Point>;
      const p2 = [data[2], data[3]] as Mutable<Point>;
      const p3 = [data[4], data[5]] as Mutable<Point>;
      const distance = distance2d(p3[0], p3[1], endPoint[0], endPoint[1]);

      if (distance < minDistance) {
        minDistance = distance;
        controlPoints = [p0, p1, p2, p3];
      }

      currentP = p3;
    }
    index++;
  }

  return controlPoints;
};
