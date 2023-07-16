import { FreeDrawLayer, Layer } from "../../../../types";
import { isFreeDrawLayerType } from "../isFreeDrawLayerType";

/**
 * Predicate function for determining free draw layers
 * @param layer Layer
 */
export const isFreeDrawLayer = (layer?: Layer | null): layer is FreeDrawLayer =>
  layer != null && isFreeDrawLayerType(layer.type);
