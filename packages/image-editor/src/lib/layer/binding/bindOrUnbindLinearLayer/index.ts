import { LayerType } from "../../../../constants";
import { BindableLayer, LinearLayer, NonDeleted } from "../../../../types";
import Scene from "../../../scene/scene/Scene";
import { mutateLayer } from "../../mutate";
import { bindLinearLayer } from "../bindLinearLayer";
import { getNonDeletedLayers } from "../getNonDeletedLayersFromScene";
import { isLinearLayerSimpleAndAlreadyBoundOnOppositeEdge } from "../isLinearLayerSimpleAndAlreadyBoundOnOppositeEdge";

/**
 * Unbinds a linear layer
 * @param linearLayer Linear layer to unbind
 * @param startOrEnd Start or end enum
 */
const unbindLinearLayer = (
  linearLayer: NonDeleted<LinearLayer>,
  startOrEnd: "start" | "end"
): BindableLayer["id"] | null => {
  const field = startOrEnd === "start" ? "startBinding" : "endBinding";
  const binding = linearLayer[field];

  if (binding == null) {
    return null;
  }

  mutateLayer(linearLayer, { [field]: null });

  return binding.layerId;
};

/**
 * Binds or unbinds linear layer edge
 * @param linearLayer Linear layer
 * @param bindableLayer Bindable layer
 * @param otherEdgeBindableLayer Other edge of the bindable layer
 * @param startOrEnd Start or end enum
 * @param boundToLayerIds Mutated binded layer IDS
 * @param unboundFromLayerIds Mutated unbinded layer IDS
 */
const bindOrUnbindLinearLayerEdge = (
  linearLayer: NonDeleted<LinearLayer>,
  bindableLayer: BindableLayer | null | "keep",
  otherEdgeBindableLayer: BindableLayer | null | "keep",
  startOrEnd: "start" | "end",
  boundToLayerIds: Set<BindableLayer["id"]>,
  unboundFromLayerIds: Set<BindableLayer["id"]>
): void => {
  if (bindableLayer !== "keep") {
    if (bindableLayer != null) {
      // Don't bind if we're trying to bind or are already bound to the same
      // layer on the other edge already ("start" edge takes precedence).
      if (
        otherEdgeBindableLayer == null ||
        (otherEdgeBindableLayer === "keep"
          ? !isLinearLayerSimpleAndAlreadyBoundOnOppositeEdge(
              linearLayer,
              bindableLayer,
              startOrEnd
            )
          : startOrEnd === "start" ||
            otherEdgeBindableLayer.id !== bindableLayer.id)
      ) {
        bindLinearLayer(linearLayer, bindableLayer, startOrEnd);
        boundToLayerIds.add(bindableLayer.id);
      }
    } else {
      const unbound = unbindLinearLayer(linearLayer, startOrEnd);
      if (unbound != null) {
        unboundFromLayerIds.add(unbound);
      }
    }
  }
};

/**
 * Binds or unbinds a linear layer
 * @param linearLayer Linear layer
 * @param startBindingLayer Start binding layer
 * @param endBindingLayer End binding layer
 */
export const bindOrUnbindLinearLayer = (
  linearLayer: NonDeleted<LinearLayer>,
  startBindingLayer: BindableLayer | null | "keep",
  endBindingLayer: BindableLayer | null | "keep"
): void => {
  const boundToLayerIds: Set<BindableLayer["id"]> = new Set();
  const unboundFromLayerIds: Set<BindableLayer["id"]> = new Set();

  bindOrUnbindLinearLayerEdge(
    linearLayer,
    startBindingLayer,
    endBindingLayer,
    "start",
    boundToLayerIds,
    unboundFromLayerIds
  );
  bindOrUnbindLinearLayerEdge(
    linearLayer,
    endBindingLayer,
    startBindingLayer,
    "end",
    boundToLayerIds,
    unboundFromLayerIds
  );

  const onlyUnbound = Array.from(unboundFromLayerIds).filter(
    (id) => !boundToLayerIds.has(id)
  );

  getNonDeletedLayers(Scene.getScene(linearLayer)!, onlyUnbound).forEach(
    (layer) => {
      mutateLayer(layer, {
        boundLayers: layer.boundLayers?.filter(
          (layer) =>
            layer.type !== LayerType.ARROW || layer.id !== linearLayer.id
        )
      });
    }
  );
};
