import { capitalize } from "~/utils/capitalize";

import { LayerType } from "../../constants";
import { editorStore, selectLayers } from "../../store";
import { Layer } from "../../types";

/**
 * Returns name for a new layer, suffixed by the latest layer index
 * computed by the number of similar layers
 * @param type Layer type
 * @param layersProp Layers array for testing
 */
export const getNewLayerName = (
  type: LayerType,
  layersProp?: Layer[]
): string => {
  const layers = layersProp || selectLayers(editorStore.getState());
  const layerPrefix = capitalize(type);
  const matchingLayers = layers.filter((layer) => layer.type === type);
  let layerIndex = 1;

  for (const layer of matchingLayers) {
    const matches = layer.name.match(new RegExp(`^${layerPrefix}[ ]([\\d]+)$`));
    if (matches?.[1]) {
      const currentMatch = Number.parseInt(matches[1]);

      if (currentMatch >= layerIndex) {
        layerIndex = currentMatch + 1;
      }
    }
  }

  return `${layerPrefix} ${layerIndex}`;
};
