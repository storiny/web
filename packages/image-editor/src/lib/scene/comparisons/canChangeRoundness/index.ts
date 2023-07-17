import { LayerType } from "../../../../constants";

/**
 * Predicate function for determining whether we can change a layer's roundness
 * @param type Layer type
 */
export const canChangeRoundness = (type: LayerType): boolean =>
  type === LayerType.RECTANGLE ||
  type === LayerType.ARROW ||
  type === LayerType.LINE ||
  type === LayerType.DIAMOND;
