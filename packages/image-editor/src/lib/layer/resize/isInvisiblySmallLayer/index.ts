import { Layer } from "../../../../types";
import { isFreeDrawLayer, isLinearLayer } from "../../predicates";

/**
 * Predicate function for determining invisibly small layers
 * @param layer Layer
 */
export const isInvisiblySmallLayer = (layer: Layer): boolean => {
  if (isLinearLayer(layer) || isFreeDrawLayer(layer)) {
    return layer.points.length < 2;
  }

  return layer.width === 0 && layer.height === 0;
};
