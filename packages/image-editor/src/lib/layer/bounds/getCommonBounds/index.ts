import { Layer } from "../../../../types";
import { getLayerBounds } from "../getLayerBounds";
import { Bounds } from "../types";

/**
 * Returns the bounds common to the specified layers
 * @param layers Layers
 */
export const getCommonBounds = (layers: readonly Layer[]): Bounds => {
  if (!layers.length) {
    return [0, 0, 0, 0];
  }

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  layers.forEach((layer) => {
    const [x1, y1, x2, y2] = getLayerBounds(layer);
    minX = Math.min(minX, x1);
    minY = Math.min(minY, y1);
    maxX = Math.max(maxX, x2);
    maxY = Math.max(maxY, y2);
  });

  return [minX, minY, maxX, maxY];
};
