import { Roundness } from "../../../../constants";
import { Layer } from "../../../../types";
import { isUsingAdaptiveRadius } from "../isUsingAdaptiveRadius";
import { isUsingProportionalRadius } from "../isUsingProportionalRadius";

/**
 * Predicate function for determining whether roundess can be applied to layer
 * @param roundness Roundness type
 * @param layer Layer to apply roundness
 */
export const canApplyRoundnessTypeToLayer = (
  roundness: Roundness,
  layer: Layer
): boolean =>
  (roundness === Roundness.ADAPTIVE_RADIUS &&
    isUsingAdaptiveRadius(layer.type)) ||
  (roundness === Roundness.PROPORTIONAL_RADIUS &&
    isUsingProportionalRadius(layer.type));
