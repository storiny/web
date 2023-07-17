import { Layer, NonDeleted } from "../../../../types";
import { isBindingLayer } from "../../predicates";
import { bindOrUnbindLinearLayer } from "../bindOrUnbindLinearLayer";

/**
 * Unbinds linear layers
 * @param layers Layers to unbind
 */
export const unbindLinearLayers = (layers: NonDeleted<Layer>[]): void => {
  layers.forEach((layer) => {
    if (isBindingLayer(layer)) {
      bindOrUnbindLinearLayer(layer, null, null);
    }
  });
};
