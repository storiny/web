import { Layer, NonDeleted } from "../../../../types";
import { getCommonBounds } from "../getCommonBounds";
import { BoundingBox } from "../types";

/**
 * Returns the common bounding box
 * @param layers Layers
 */
export const getCommonBoundingBox = (
  layers: Layer[] | readonly NonDeleted<Layer>[]
): BoundingBox => {
  const [minX, minY, maxX, maxY] = getCommonBounds(layers);
  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
    midX: (minX + maxX) / 2,
    midY: (minY + maxY) / 2
  };
};
