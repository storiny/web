import { LayerType } from "../../../../constants";

/**
 * Predicate function for determining free draw layer types
 * @param layerType Layer type
 */
export const isFreeDrawLayerType = (
  layerType: LayerType
): layerType is LayerType.FREE_DRAW => layerType === LayerType.FREE_DRAW;
