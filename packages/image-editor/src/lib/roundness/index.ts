import { LayerType, Roundness } from "../../constants";
import { Layer } from "../../types";

/**
 * Returns the default roundness type for layer
 * @param layer Layer
 */
export const getDefaultRoundnessTypeForLayer = (
  layer: Layer
): { type: Roundness } | null => {
  if (
    layer.type === LayerType.ARROW ||
    layer.type === LayerType.LINE ||
    layer.type === LayerType.DIAMOND
  ) {
    return {
      type: Roundness.PROPORTIONAL_RADIUS
    };
  }

  if (layer.type === LayerType.RECTANGLE) {
    return {
      type: Roundness.ADAPTIVE_RADIUS
    };
  }

  return null;
};
