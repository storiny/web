import { Layer, LinearLayer } from "../../../../types";
import { isBindingLayerType } from "../isBindingLayerType";

/**
 * Predicate function for determining binding layers
 * @param layer Layer
 * @param includeLocked Whether to include locked layers
 */
export const isBindingLayer = (
  layer?: Layer | null,
  includeLocked = true
): layer is LinearLayer =>
  layer != null &&
  (!layer.locked || includeLocked) &&
  isBindingLayerType(layer.type);
