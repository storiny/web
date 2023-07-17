import { BindableLayer, LinearLayer, NonDeleted } from "../../../../types";

/**
 * Predicate function for checking whether a simple linear layer is already bound
 * @param linearLayer Linear layer
 * @param alreadyBoundToId Bindable layer ID
 * @param bindableLayer Bindable layer
 */
export const isLinearLayerSimpleAndAlreadyBound = (
  linearLayer: NonDeleted<LinearLayer>,
  alreadyBoundToId: BindableLayer["id"] | undefined,
  bindableLayer: BindableLayer
): boolean =>
  alreadyBoundToId === bindableLayer.id && linearLayer.points.length < 3;
