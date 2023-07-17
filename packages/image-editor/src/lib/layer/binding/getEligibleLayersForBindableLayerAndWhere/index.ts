import { BindableLayer, LinearLayer, NonDeleted } from "../../../../types";
import Scene from "../../../scene/scene/Scene";
import { bindingBorderTest } from "../../collision";
import { isBindingLayer } from "../../predicates";
import { getLinearLayerEdgeCoors } from "../getLinearLayerEdgeCoors";
import { isLinearLayerSimpleAndAlreadyBoundOnOppositeEdge } from "../isLinearLayerSimpleAndAlreadyBoundOnOppositeEdge";
import { SuggestedPointBinding } from "../types";

/**
 * Predicate function for checking whether a linear layer is avaliable for binding
 * @param linearLayer Linear layer to check
 * @param startOrEnd Start or end enum
 * @param bindableLayer Bindable layer
 */
const isLinearLayerEligibleForNewBindingByBindable = (
  linearLayer: NonDeleted<LinearLayer>,
  startOrEnd: "start" | "end",
  bindableLayer: NonDeleted<BindableLayer>
): boolean => {
  const existingBinding =
    linearLayer[startOrEnd === "start" ? "startBinding" : "endBinding"];
  return (
    existingBinding == null &&
    !isLinearLayerSimpleAndAlreadyBoundOnOppositeEdge(
      linearLayer,
      bindableLayer,
      startOrEnd
    ) &&
    bindingBorderTest(
      bindableLayer,
      getLinearLayerEdgeCoors(linearLayer, startOrEnd)
    )
  );
};

/**
 * Returns the elligible layers for bindable layer with suggested bindings
 * @param bindableLayer Bindable layer
 */
export const getEligibleLayersForBindableLayerAndWhere = (
  bindableLayer: NonDeleted<BindableLayer>
): SuggestedPointBinding[] =>
  Scene.getScene(bindableLayer)!
    .getNonDeletedLayers()
    .map((layer) => {
      if (!isBindingLayer(layer, false)) {
        return null;
      }

      const canBindStart = isLinearLayerEligibleForNewBindingByBindable(
        layer,
        "start",
        bindableLayer
      );
      const canBindEnd = isLinearLayerEligibleForNewBindingByBindable(
        layer,
        "end",
        bindableLayer
      );

      if (!canBindStart && !canBindEnd) {
        return null;
      }

      return [
        layer,
        canBindStart && canBindEnd ? "both" : canBindStart ? "start" : "end",
        bindableLayer
      ];
    })
    .filter((maybeLayer) => maybeLayer != null) as SuggestedPointBinding[];
