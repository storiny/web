import { NonDeletedLayer } from "../../../../types";

/**
 * Returns layer at the specified position if it exists, null otherwise
 * @param layers Layers
 * @param isAtPositionFn Position function
 */
export const getLayerAtPosition = (
  layers: readonly NonDeletedLayer[],
  isAtPositionFn: (layer: NonDeletedLayer) => boolean
): NonDeletedLayer | null => {
  let hitLayer = null;
  // We need to perform hit testing from the front (end of the array) to back (beginning of the array)
  // because the array is ordered from lower z-index to the highest, and we want layers
  // with higher z-indices

  for (let index = layers.length - 1; index >= 0; --index) {
    const layer = layers[index];

    if (layer.isDeleted) {
      continue;
    }

    if (isAtPositionFn(layer)) {
      hitLayer = layer;
      break;
    }
  }

  return hitLayer;
};
