import { LayerType } from "../../../../constants";

/**
 * Predicate function for determining whether the layer uses
 * proportional radius
 * @param type Layer type
 */
export const isUsingProportionalRadius = (type: string): boolean =>
  type === LayerType.LINE ||
  type === LayerType.ARROW ||
  type === LayerType.DIAMOND;
