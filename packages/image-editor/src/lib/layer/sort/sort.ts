import { LayerType } from "../../constants";
import { Layer } from "../../types";
import { arrayToMapWithIndex } from "../utils";

/**
 * Normalizes a group's layer order
 * @param layers Layers
 */
const normalizeGroupLayerOrder = (
  layers: readonly Layer[]
): readonly Layer[] => {
  const originalLayers: Layer[] = layers.slice();
  const sortedLayers = new Set<Layer>();

  const orderInnerGroups = (layers: readonly Layer[]): Layer[] => {
    const firstGroupSig = layers[0]?.groupIds?.join("");
    const aGroup: Layer[] = [layers[0]];
    const bGroup: Layer[] = [];

    for (const layer of layers.slice(1)) {
      if (layer.groupIds?.join("") === firstGroupSig) {
        aGroup.push(layer);
      } else {
        bGroup.push(layer);
      }
    }

    return bGroup.length ? [...aGroup, ...orderInnerGroups(bGroup)] : aGroup;
  };

  const groupHandledLayers = new Map<string, true>();

  originalLayers.forEach((layer, index) => {
    if (groupHandledLayers.has(layer.id)) {
      return;
    }

    if (layer.groupIds?.length) {
      const topGroup = layer.groupIds[layer.groupIds.length - 1];
      const groupLayers = originalLayers.slice(index).filter((layer) => {
        const ret = layer?.groupIds?.some((id) => id === topGroup);

        if (ret) {
          groupHandledLayers.set(layer!.id, true);
        }

        return ret;
      });

      for (const elem of orderInnerGroups(groupLayers)) {
        sortedLayers.add(elem);
      }
    } else {
      sortedLayers.add(layer);
    }
  });

  if (sortedLayers.size !== layers.length) {
    return layers;
  }

  return [...sortedLayers];
};

/**
 * Normalizes bound layers order and sorts containers and their bound texts
 * together. In theory, when we have text layers bound to
 * a container, they should be right after the container layer in the layer array.
 * @param layers Layers
 */
const normalizeBoundLayersOrder = (
  layers: readonly Layer[]
): readonly Layer[] => {
  const layersMap = arrayToMapWithIndex(layers);
  const originalLayers: (Layer | null)[] = layers.slice();
  const sortedLayers = new Set<Layer>();

  originalLayers.forEach((layer, index) => {
    if (!layer) {
      return;
    }

    if (layer.boundLayers?.length) {
      sortedLayers.add(layer);
      originalLayers[index] = null;

      layer.boundLayers.forEach((boundLayer) => {
        const child = layersMap.get(boundLayer.id);

        if (child && boundLayer.type === LayerType.TEXT) {
          sortedLayers.add(child[0]);
          originalLayers[child[1]] = null;
        }
      });
    } else if (layer.type === LayerType.TEXT && layer.containerId) {
      const parent = layersMap.get(layer.containerId);

      if (!parent?.[0].boundLayers?.find(({ id }) => id === layer.id)) {
        sortedLayers.add(layer);
        originalLayers[index] = null;
      }
    } else {
      sortedLayers.add(layer);
      originalLayers[index] = null;
    }
  });

  if (sortedLayers.size !== layers.length) {
    return layers;
  }

  return [...sortedLayers];
};

/**
 * Normalizes layer order
 * @param layers Layers
 */
export const normalizeLayerOrder = (
  layers: readonly Layer[]
): readonly Layer[] =>
  normalizeBoundLayersOrder(normalizeGroupLayerOrder(layers));
