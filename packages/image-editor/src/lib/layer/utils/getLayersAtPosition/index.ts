import { NonDeletedLayer } from "../../../../types";

/**
 * Returns layers at the specified position
 * @param layers Layers
 * @param isAtPositionFn Position function
 */
export const getLayersAtPosition = (
  layers: readonly NonDeletedLayer[],
  isAtPositionFn: (layer: NonDeletedLayer) => boolean
): NonDeletedLayer[] =>
  layers.filter((layer) => !layer.isDeleted && isAtPositionFn(layer));
