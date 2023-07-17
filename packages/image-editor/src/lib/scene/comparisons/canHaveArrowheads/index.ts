import { LayerType } from "../../../../constants";

/**
 * Predicate function for determining whether a layer can have arrowheads
 * @param type Layer type
 */
export const canHaveArrowheads = (type: LayerType): boolean =>
  type === LayerType.ARROW;
