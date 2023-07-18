import { BindableLayer, LinearLayer, NonDeleted } from "../../../../types";
import { Scene } from "../../../scene";
import { getHoveredLayerForBinding } from "../getHoveredLayerForBinding";
import { getLinearLayerEdgeCoors } from "../getLinearLayerEdgeCoors";

/**
 * Returns the layer elligible for binding layer
 * @param linearLayer Linear layer
 * @param startOrEnd Start or end enum
 */
export const getEligibleLayerForBindingLayer = (
  linearLayer: NonDeleted<LinearLayer>,
  startOrEnd: "start" | "end"
): NonDeleted<BindableLayer> | null =>
  getHoveredLayerForBinding(
    getLinearLayerEdgeCoors(linearLayer, startOrEnd),
    Scene.getScene(linearLayer)!
  );
