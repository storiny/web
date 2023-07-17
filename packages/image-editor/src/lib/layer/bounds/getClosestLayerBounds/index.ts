import { Layer } from "../../../../types";
import { distance2d } from "../../../math";
import { getLayerBounds } from "../getLayerBounds";
import { Bounds } from "../types";

/**
 * Returns the closest layer bounds from the specified coordinates
 * @param layers Layers
 * @param from Source point
 */
export const getClosestLayerBounds = (
  layers: readonly Layer[],
  from: { x: number; y: number }
): Bounds => {
  if (!layers.length) {
    return [0, 0, 0, 0];
  }

  let minDistance = Infinity;
  let closestLayer = layers[0];

  layers.forEach((layer) => {
    const [x1, y1, x2, y2] = getLayerBounds(layer);
    const distance = distance2d((x1 + x2) / 2, (y1 + y2) / 2, from.x, from.y);

    if (distance < minDistance) {
      minDistance = distance;
      closestLayer = layer;
    }
  });

  return getLayerBounds(closestLayer);
};
