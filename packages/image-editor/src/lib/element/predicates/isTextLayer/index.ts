import { LayerType } from "../../../../constants";
import { Layer, TextLayer } from "../../../../types";

/**
 * Predicate function for determining text layers
 * @param layer Layer
 */
export const isTextLayer = (layer: Layer | null): layer is TextLayer =>
  layer != null && layer.type === LayerType.TEXT;
