import { BindableLayer, LinearLayer, NonDeleted } from "../../../../types";
import { isLinearLayerSimpleAndAlreadyBound } from "../isLinearLayerSimpleAndAlreadyBound";

/**
 * Prevents binding both ends of a simple segment
 * @param linearLayer Linear layer
 * @param bindableLayer Bindable layer
 * @param startOrEnd Start or end enum
 */
export const isLinearLayerSimpleAndAlreadyBoundOnOppositeEdge = (
  linearLayer: NonDeleted<LinearLayer>,
  bindableLayer: BindableLayer,
  startOrEnd: "start" | "end"
): boolean => {
  const otherBinding =
    linearLayer[startOrEnd === "start" ? "endBinding" : "startBinding"];

  return isLinearLayerSimpleAndAlreadyBound(
    linearLayer,
    otherBinding?.layerId,
    bindableLayer
  );
};
