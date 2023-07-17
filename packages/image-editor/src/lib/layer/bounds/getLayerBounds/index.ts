import { Layer } from "../../../../types";
import { LayerBounds } from "../layerBounds";
import { Bounds } from "../types";

/**
 * Returns the layer bounds
 * @param layer Layer
 */
export const getLayerBounds = (layer: Layer): Bounds =>
  LayerBounds.getBounds(layer);
