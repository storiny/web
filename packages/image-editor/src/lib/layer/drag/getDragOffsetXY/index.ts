import { NonDeletedLayer } from "../../../../types";
import { getCommonBounds } from "../../bounds";

/**
 * Returns the X and Y drag offset
 * @param selectedLayers Selected layers
 * @param x X value
 * @param y Y value
 */
export const getDragOffsetXY = (
  selectedLayers: NonDeletedLayer[],
  x: number,
  y: number
): [number, number] => {
  const [x1, y1] = getCommonBounds(selectedLayers);
  return [x - x1, y - y1];
};
