import { LayerType } from "../../../../constants";

/**
 * Predicate function for determining whether a layer supports stroke color
 * @param type Layer type
 */
export const hasStrokeColor = (type: LayerType): boolean =>
  type !== LayerType.IMAGE;
