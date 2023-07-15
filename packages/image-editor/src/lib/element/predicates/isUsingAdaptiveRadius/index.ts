import { LayerType } from "../../../../constants";

/**
 * Predicate function for determining whether the layer uses adaptive
 * radius
 * @param type Layer type
 */
export const isUsingAdaptiveRadius = (type: string): boolean =>
  type === LayerType.RECTANGLE;
