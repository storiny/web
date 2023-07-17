import {
  BindableLayer,
  Layer,
  LinearLayer,
  NonDeleted
} from "../../../../types";
import { isBindableLayer, isBindingLayer } from "../../predicates";
import { getEligibleLayerForBindingLayer } from "../getEligibleLayerForBindingLayer";
import { getEligibleLayersForBindableLayerAndWhere } from "../getEligibleLayersForBindableLayerAndWhere";
import { SuggestedBinding } from "../types";

/**
 * Returns the layers eligible for binding layer
 * @param linearLayer Linear layer
 */
const getEligibleLayersForBindingLayer = (
  linearLayer: NonDeleted<LinearLayer>
): NonDeleted<BindableLayer>[] =>
  [
    getEligibleLayerForBindingLayer(linearLayer, "start"),
    getEligibleLayerForBindingLayer(linearLayer, "end")
  ].filter((layer): layer is NonDeleted<BindableLayer> => layer != null);

/**
 * Returns the layers eligible for binding
 * @param layers Layers to check for eligibility
 */
export const getEligibleLayersForBinding = (
  layers: NonDeleted<Layer>[]
): SuggestedBinding[] => {
  const includedLayerIds = new Set(layers.map(({ id }) => id));
  return layers.flatMap((layer) =>
    isBindingLayer(layer, false)
      ? (getEligibleLayersForBindingLayer(
          layer as NonDeleted<LinearLayer>
        ).filter(
          (layer) => !includedLayerIds.has(layer.id)
        ) as SuggestedBinding[])
      : isBindableLayer(layer, false)
      ? getEligibleLayersForBindableLayerAndWhere(layer).filter(
          (binding) => !includedLayerIds.has(binding[0].id)
        )
      : []
  );
};
