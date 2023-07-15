import { LayerType } from "../../../../constants";

/**
 * Predicate function for determining linear layer type
 * @param layerType Layer type
 */
export const isLinearLayerType = (layerType: LayerType): boolean =>
  layerType === LayerType.ARROW || layerType === LayerType.LINE;
