import { LayerType } from "../../../../constants";

/**
 * Predicate function for determining binding layer type
 * @param layerType Layer type
 */
export const isBindingLayerType = (
  layerType: LayerType
): layerType is LayerType.ARROW => layerType === LayerType.ARROW;
