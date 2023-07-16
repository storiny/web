import { LayerType } from "../../../../constants";
import { Layer, TextLayerWithContainer } from "../../../../types";
import { isArrowLayer } from "../isArrowLayer";

/**
 * Predicate function for determining bindable container layers
 * @param layer Layer
 * @param includeLocked Whether to include locked layers
 */
export const isTextBindableContainer = (
  layer: Layer | null,
  includeLocked = true
): layer is TextLayerWithContainer =>
  layer != null &&
  (!layer.locked || includeLocked) &&
  (layer.type === LayerType.RECTANGLE ||
    layer.type === LayerType.DIAMOND ||
    layer.type === LayerType.ELLIPSE ||
    isArrowLayer(layer));
