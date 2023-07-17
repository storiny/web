import rough from "roughjs";

import { rescalePoints } from "../../../../core/points";
import { Layer } from "../../../../types";
import { generateRoughOptions } from "../../../renderer";
import { isFreeDrawLayer, isLinearLayer } from "../../predicates";
import { getBoundsFromPoints } from "../getBoundsFromPoints";
import { getCurvePathOps } from "../getCurvePathOps";
import { getMinMaxXYFromCurvePathOps } from "../getMinMaxXYFromCurvePathOps";

/**
 * Returns the absolute layer coordinates after resizing
 * @param layer Layer
 * @param nextWidth New width
 * @param nextHeight New height
 * @param normalizePoints Whether to normalize layer points
 */
export const getResizedLayerAbsoluteCoords = (
  layer: Layer,
  nextWidth: number,
  nextHeight: number,
  normalizePoints: boolean
): [number, number, number, number] => {
  if (!(isLinearLayer(layer) || isFreeDrawLayer(layer))) {
    return [layer.x, layer.y, layer.x + nextWidth, layer.y + nextHeight];
  }

  const points = rescalePoints(
    0,
    nextWidth,
    rescalePoints(1, nextHeight, layer.points, normalizePoints),
    normalizePoints
  );

  let bounds: [number, number, number, number];

  if (isFreeDrawLayer(layer)) {
    // Free Draw
    bounds = getBoundsFromPoints(points);
  } else {
    // Line
    const gen = rough.generator();
    const curve = !layer.roundness
      ? gen.linearPath(
          points as [number, number][],
          generateRoughOptions(layer)
        )
      : gen.curve(points as [number, number][], generateRoughOptions(layer));

    const ops = getCurvePathOps(curve);
    bounds = getMinMaxXYFromCurvePathOps(ops);
  }

  const [minX, minY, maxX, maxY] = bounds;
  return [minX + layer.x, minY + layer.y, maxX + layer.x, maxY + layer.y];
};
