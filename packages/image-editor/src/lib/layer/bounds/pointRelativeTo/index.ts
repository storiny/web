import { Layer, Point } from "../../../../types";

/**
 * Returns the relative position of a point with respect to the layer using
 * its absolute coordinates
 * @param layer Layer
 * @param absoluteCoords Absolute point coordinates
 */
export const pointRelativeTo = (layer: Layer, absoluteCoords: Point): Point => [
  absoluteCoords[0] - layer.x,
  absoluteCoords[1] - layer.y
];
