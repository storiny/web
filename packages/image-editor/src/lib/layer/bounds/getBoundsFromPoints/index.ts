import { FreeDrawLayer } from "../../../../types";

/**
 * Returns the bounds from points
 * @param points Free draw layer
 */
export const getBoundsFromPoints = (
  points: FreeDrawLayer["points"]
): [number, number, number, number] => {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const [x, y] of points) {
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }

  return [minX, minY, maxX, maxY];
};
