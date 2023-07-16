import { LayerType } from "../../../../constants";
import { ImageLayer, Layer } from "../../../../types";

/**
 * Predicate function for determining image layers
 * @param layer Layer
 */
export const isImageLayer = (layer: Layer | null): layer is ImageLayer =>
  !!layer && layer.type === LayerType.IMAGE;
