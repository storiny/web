import { BaseFabricObject, Canvas } from "fabric";

import { capitalize } from "~/utils/capitalize";

import { LayerType } from "../../constants";

/**
 * Returns name for a new layer, suffixed by the latest layer index
 * computed by the number of similar layers
 * @param type Layer type
 * @param canvas Canvas
 * @param layers_prop Layers array for testing
 */
export const get_new_layer_name = (
  type: LayerType,
  canvas?: Canvas,
  layers_prop?: Partial<BaseFabricObject>[]
): string => {
  const layers = layers_prop || canvas?.getObjects() || [];
  const layer_prefix = capitalize(type);
  const matching_layers = layers.filter(
    (layer) => layer.get?.("_type") === type
  );
  let layer_index = 1;

  for (const layer of matching_layers) {
    const layer_name = layer.get?.("name");

    if (layer_name) {
      const matches = layer_name.match(
        new RegExp(`^${layer_prefix}[ ]([\\d]+)$`)
      );

      if (matches?.[1]) {
        const current_match = Number.parseInt(matches[1]);

        if (current_match >= layer_index) {
          layer_index = current_match + 1;
        }
      }
    }
  }

  return `${layer_prefix} ${layer_index}`;
};
