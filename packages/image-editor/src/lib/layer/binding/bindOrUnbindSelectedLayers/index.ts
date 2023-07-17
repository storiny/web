import { BindableLayer, Layer, NonDeleted } from "../../../../types";
import { isBindableLayer, isBindingLayer } from "../../predicates";
import { bindOrUnbindLinearLayer } from "../bindOrUnbindLinearLayer";
import { getEligibleLayerForBindingLayer } from "../getEligibleLayerForBindingLayer";
import { getEligibleLayersForBindableLayerAndWhere } from "../getEligibleLayersForBindableLayerAndWhere";

/**
 * Tries to bind a bindable layer
 * @param bindableLayer Bindable layer
 */
const maybeBindBindableLayer = (
  bindableLayer: NonDeleted<BindableLayer>
): void => {
  getEligibleLayersForBindableLayerAndWhere(bindableLayer).forEach(
    ([linearLayer, where]) =>
      bindOrUnbindLinearLayer(
        linearLayer,
        where === "end" ? "keep" : bindableLayer,
        where === "start" ? "keep" : bindableLayer
      )
  );
};

/**
 * Binds or unbinds selected layers
 * @param layers Layers
 */
export const bindOrUnbindSelectedLayers = (
  layers: NonDeleted<Layer>[]
): void => {
  layers.forEach((layer) => {
    if (isBindingLayer(layer)) {
      bindOrUnbindLinearLayer(
        layer,
        getEligibleLayerForBindingLayer(layer, "start"),
        getEligibleLayerForBindingLayer(layer, "end")
      );
    } else if (isBindableLayer(layer)) {
      maybeBindBindableLayer(layer);
    }
  });
};
