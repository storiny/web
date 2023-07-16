import { LayerType } from "../../../../constants";
import { BindableLayer, Layer } from "../../../../types";

/**
 * Predicate function for determining bindable layers
 * @param layer Layer
 * @param includeLocked Whether to include locked layers
 */
export const isBindableLayer = (
  layer: Layer | null,
  includeLocked = true
): layer is BindableLayer =>
  layer != null &&
  (!layer.locked || includeLocked) &&
  (layer.type === LayerType.RECTANGLE ||
    layer.type === LayerType.DIAMOND ||
    layer.type === LayerType.ELLIPSE ||
    layer.type === LayerType.IMAGE ||
    (layer.type === LayerType.TEXT && !layer.containerId));
