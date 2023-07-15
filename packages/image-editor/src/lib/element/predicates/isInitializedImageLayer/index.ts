import { LayerType } from "../../../../constants";
import { InitializedImageLayer, Layer } from "../../../../types";

/**
 * Predicate function for determining initialized image layers
 * @param layer Layer
 */
export const isInitializedImageLayer = (
  layer: Layer | null
): layer is InitializedImageLayer =>
  !!layer && layer.type === LayerType.IMAGE && !!layer.fileId;
