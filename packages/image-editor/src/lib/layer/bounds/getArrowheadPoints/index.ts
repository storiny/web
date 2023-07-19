import { Drawable } from "roughjs/bin/core";

import { Arrowhead } from "../../../../constants";
import { LinearLayer, Point } from "../../../../types";
import { rotate } from "../../../math";
import { getCurvePathOps } from "../getCurvePathOps";

/**
 * Returns the arrowhead points
 * @param layer Linear layer
 * @param shape Shape
 * @param position Position
 * @param arrowhead Arrowhead type
 */
export const getArrowheadPoints = (
  layer: LinearLayer,
  shape: Drawable[],
  position: "start" | "end",
  arrowhead: Arrowhead
): number[] | null => {
  const ops = getCurvePathOps(shape[0]);

  if (ops.length < 1) {
    return null;
  }

  // The index of the bCurve operation to examine.
  const index = position === "start" ? 1 : ops.length - 1;
  const data = ops[index].data;
  const p3 = [data[4], data[5]] as Point;
  const p2 = [data[2], data[3]] as Point;
  const p1 = [data[0], data[1]] as Point;

  // We need to find p0 of the bézier curve.
  // It is typically the last point of the previous
  // curve; it can also be the position of moveTo operation.
  const prevOp = ops[index - 1];
  let p0: Point = [0, 0];

  if (prevOp.op === "move") {
    p0 = prevOp.data as unknown as Point;
  } else if (prevOp.op === "bcurveTo") {
    p0 = [prevOp.data[4], prevOp.data[5]];
  }

  // B(t) = p0 * (1-t)^3 + 3p1 * t * (1-t)^2 + 3p2 * t^2 * (1-t) + p3 * t^3
  const equation = (t: number, idx: number): number =>
    Math.pow(1 - t, 3) * p3[idx] +
    3 * t * Math.pow(1 - t, 2) * p2[idx] +
    3 * Math.pow(t, 2) * (1 - t) * p1[idx] +
    p0[idx] * Math.pow(t, 3);

  // We know the last point of the arrow (or the first, if start arrowhead)
  const [x2, y2] = position === "start" ? p0 : p3;

  // By using cubic bezier equation (B(t)) and the given parameters,
  // we calculate a point that is closer to the last point.
  // The value 0.3 is chosen arbitrarily, and it works best for all
  // the tested cases
  const [x1, y1] = [equation(0.3, 0), equation(0.3, 1)];

  // Find the normalized direction vector based on the
  // previously calculated points.
  const distance = Math.hypot(x2 - x1, y2 - y1);
  const nx = (x2 - x1) / distance;
  const ny = (y2 - y1) / distance;

  const size = {
    [Arrowhead.ARROW]: 30,
    [Arrowhead.BAR]: 15,
    [Arrowhead.DOT]: 15,
    [Arrowhead.TRIANGLE]: 15
  }[arrowhead]; // pixels (will differ for each arrowhead)

  let length = 0;

  if (arrowhead === Arrowhead.ARROW) {
    // Length for arrows is based on the length of the last section
    const [cx, cy] = layer.points[layer.points.length - 1];
    const [px, py] =
      layer.points.length > 1 ? layer.points[layer.points.length - 2] : [0, 0];

    length = Math.hypot(cx - px, cy - py);
  } else {
    // Length for other arrowhead types is based on the total length of the line
    for (let i = 0; i < layer.points.length; i++) {
      const [px, py] = layer.points[i - 1] || [0, 0];
      const [cx, cy] = layer.points[i];
      length += Math.hypot(cx - px, cy - py);
    }
  }

  // Scale down the arrowhead until we hit a certain size so that it doesn't look weird
  // This value is selected by minimizing a minimum size with the last segment of the arrowhead
  const minSize = Math.min(size, length / 2);
  const xs = x2 - nx * minSize;
  const ys = y2 - ny * minSize;

  if (arrowhead === Arrowhead.DOT) {
    const r = Math.hypot(ys - y2, xs - x2) + layer.strokeWidth;
    return [x2, y2, r] as [number, number, number];
  }

  const angle = {
    [Arrowhead.ARROW]: 20,
    [Arrowhead.BAR]: 90,
    [Arrowhead.TRIANGLE]: 25
  }[arrowhead]; // degrees

  // Return points
  const [x3, y3] = rotate(xs, ys, x2, y2, (-angle * Math.PI) / 180);
  const [x4, y4] = rotate(xs, ys, x2, y2, (angle * Math.PI) / 180);

  return [x2, y2, x3, y3, x4, y4];
};
