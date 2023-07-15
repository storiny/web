import { LayerType } from "../../../../constants";
import { Layer, LinearLayer } from "../../../../types";

/**
 * Predicate function for determining arrow layers
 * @param layer Layer
 */
export const isArrowLayer = (layer?: Layer | null): layer is LinearLayer =>
  layer != null && layer.type === LayerType.ARROW;
