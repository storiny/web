import { LayerType } from "../../../../constants";
import { GenericLayer, Layer } from "../../../../types";

/**
 * Predicate function for determining generic layers
 * @param layer Layer
 */
export const isGenericLayer = (layer: Layer | null): layer is GenericLayer =>
  layer != null &&
  (layer.type === LayerType.SELECTION ||
    layer.type === LayerType.RECTANGLE ||
    layer.type === LayerType.DIAMOND ||
    layer.type === LayerType.ELLIPSE);
