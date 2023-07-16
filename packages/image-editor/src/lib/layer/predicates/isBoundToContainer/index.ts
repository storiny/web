import { Layer, TextLayerWithContainer } from "../../../../types";
import { isTextLayer } from "../isTextLayer";

/**
 * Predicate function for determining contained text layers
 * @param layer Layer
 */
export const isBoundToContainer = (
  layer: Layer | null
): layer is TextLayerWithContainer =>
  layer !== null &&
  "containerId" in layer &&
  layer.containerId !== null &&
  isTextLayer(layer);
