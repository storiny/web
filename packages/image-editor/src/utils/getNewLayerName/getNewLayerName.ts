import { BaseFabricObject, Canvas } from "fabric";

import { capitalize } from "~/utils/capitalize";

import { LayerType } from "../../constants";

/**
 * Returns name for a new layer, suffixed by the latest layer index
 * computed by the number of similar layers
 * @param type Layer type
 * @param canvas Canvas
 * @param layersProp Layers array for testing
 */
export const getNewLayerName = (
  type: LayerType,
  canvas?: Canvas,
  layersProp?: Partial<BaseFabricObject>[]
): string => {
  const layers = layersProp || canvas?.getObjects() || [];
  const layerPrefix = capitalize(type);
  const matchingLayers = layers.filter(
    (layer) => layer.get?.("_type") === type
  );
  let layerIndex = 1;

  for (const layer of matchingLayers) {
    const layerName = layer.get?.("name");

    if (layerName) {
      const matches = layerName.match(
        new RegExp(`^${layerPrefix}[ ]([\\d]+)$`)
      );

      if (matches?.[1]) {
        const currentMatch = Number.parseInt(matches[1]);

        if (currentMatch >= layerIndex) {
          layerIndex = currentMatch + 1;
        }
      }
    }
  }

  return `${layerPrefix} ${layerIndex}`;
};
