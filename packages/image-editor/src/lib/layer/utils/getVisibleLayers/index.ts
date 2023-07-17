import { Layer, NonDeletedLayer } from "../../../../types";
import { isInvisiblySmallLayer } from "../../resize";

/**
 * Returns the visible layers from the provided array of layers
 * @param layers Layers
 */
export const getVisibleLayers = (
  layers: readonly Layer[]
): readonly NonDeletedLayer[] =>
  layers.filter(
    (layer) => !layer.isDeleted && !isInvisiblySmallLayer(layer)
  ) as readonly NonDeletedLayer[];
