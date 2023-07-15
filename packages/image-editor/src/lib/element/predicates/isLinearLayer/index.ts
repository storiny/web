import { Layer, LinearLayer } from "../../../../types";
import { isLinearLayerType } from "../isLinearLayerType";

/**
 * Predicate function for determining linear layers
 * @param layer Layer
 */
export const isLinearLayer = (layer?: Layer | null): layer is LinearLayer =>
  layer != null && isLinearLayerType(layer.type);
