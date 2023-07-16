import { Roundness } from "../../../constants";
import {
  DEFAULT_ADAPTIVE_RADIUS,
  DEFAULT_PROPORTIONAL_RADIUS
} from "../../../core/constants";
import { Layer } from "../../../types";

/**
 * Returns the corner radius value for a layer
 * @param x X value
 * @param layer Layer
 */
export const getCornerRadius = (x: number, layer: Layer): number => {
  if (layer.roundness?.type === Roundness.PROPORTIONAL_RADIUS) {
    return x * DEFAULT_PROPORTIONAL_RADIUS;
  }

  if (layer.roundness?.type === Roundness.ADAPTIVE_RADIUS) {
    const fixedRadiusSize = layer.roundness?.value ?? DEFAULT_ADAPTIVE_RADIUS;
    const CUTOFF_SIZE = fixedRadiusSize / DEFAULT_PROPORTIONAL_RADIUS;

    if (x <= CUTOFF_SIZE) {
      return x * DEFAULT_PROPORTIONAL_RADIUS;
    }

    return fixedRadiusSize;
  }

  return 0;
};
