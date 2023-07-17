import rough from "roughjs";

import { LinearLayer } from "../../../../types";
import { generateRoughOptions } from "../../../renderer";
import { getCurvePathOps } from "../getCurvePathOps";
import { getMinMaxXYFromCurvePathOps } from "../getMinMaxXYFromCurvePathOps";

/**
 * Returns the layer points coordinates
 * @param layer Layer
 * @param points Points for calculation
 */
export const getLayerPointsCoords = (
  layer: LinearLayer,
  points: readonly (readonly [number, number])[]
): [number, number, number, number] => {
  // This might be computationally heavy
  const gen = rough.generator();
  const curve =
    layer.roundness == null
      ? gen.linearPath(
          points as [number, number][],
          generateRoughOptions(layer)
        )
      : gen.curve(points as [number, number][], generateRoughOptions(layer));
  const ops = getCurvePathOps(curve);
  const [minX, minY, maxX, maxY] = getMinMaxXYFromCurvePathOps(ops);

  return [minX + layer.x, minY + layer.y, maxX + layer.x, maxY + layer.y];
};
