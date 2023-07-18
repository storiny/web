import { NonDeletedLayer } from "../../../../types";
import { getCommonBounds } from "../../../layer";
import { distance } from "../../../utils";

/**
 * Computes the smallest area to fit the contents in
 * @param layers Layers
 * @param exportPadding Padding
 */
export const getCanvasSize = (
  layers: readonly NonDeletedLayer[],
  exportPadding: number
): [number, number, number, number] => {
  const [minX, minY, maxX, maxY] = getCommonBounds(layers);
  const width = distance(minX, maxX) + exportPadding * 2;
  const height = distance(minY, maxY) + exportPadding * 2;

  return [minX, minY, width, height];
};

/**
 * Computes the physical export size
 * @param layers Layers
 * @param exportPadding Padding
 * @param scale Scale
 */
export const getExportSize = (
  layers: readonly NonDeletedLayer[],
  exportPadding: number,
  scale: number
): [number, number] => {
  const [, , width, height] = getCanvasSize(layers, exportPadding).map(
    (dimension) => Math.trunc(dimension * scale)
  );

  return [width, height];
};
