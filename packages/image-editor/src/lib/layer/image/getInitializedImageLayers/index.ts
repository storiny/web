import { InitializedImageLayer, Layer } from "../../../../types";

/**
 * Filters the initialized layers out from the given layers
 * @param layers Layers
 */
export const getInitializedImageLayers = (
  layers: readonly Layer[]
): InitializedImageLayer[] =>
  layers.filter((layer) =>
    isInitializedImageLayer(layer)
  ) as InitializedImageLayer[];
