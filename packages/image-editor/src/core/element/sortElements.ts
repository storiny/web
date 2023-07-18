import { arrayToMapWithIndex } from "../../lib/utils/utils";
import { ExcalidrawLayer } from "./types";

const normalizeGroupLayerOrder = (layers: readonly ExcalidrawLayer[]) => {
  const origLayers: ExcalidrawLayer[] = layers.slice();
  const sortedLayers = new Set<ExcalidrawLayer>();

  const orderInnerGroups = (
    layers: readonly ExcalidrawLayer[]
  ): ExcalidrawLayer[] => {
    const firstGroupSig = layers[0]?.groupIds?.join("");
    const aGroup: ExcalidrawLayer[] = [layers[0]];
    const bGroup: ExcalidrawLayer[] = [];
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

  origLayers.forEach((layer, idx) => {
    if (groupHandledLayers.has(layer.id)) {
      return;
    }
    if (layer.groupIds?.length) {
      const topGroup = layer.groupIds[layer.groupIds.length - 1];
      const groupLayers = origLayers.slice(idx).filter((layer) => {
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

  // if there's a bug which resulted in losing some of the layers, return
  // original instead as that's better than losing data
  if (sortedLayers.size !== layers.length) {
    console.error("normalizeGroupLayerOrder: lost some layers... bailing!");
    return layers;
  }

  return [...sortedLayers];
};

/**
 * In theory, when we have text layers bound to a container, they
 * should be right after the container layer in the layers array.
 * However, this is not guaranteed due to old and potential future bugs.
 *
 * This function sorts containers and their bound texts together. It prefers
 * original z-index of container (i.e. it moves bound text layers after
 * containers).
 */
const normalizeBoundLayersOrder = (layers: readonly ExcalidrawLayer[]) => {
  const layersMap = arrayToMapWithIndex(layers);

  const origLayers: (ExcalidrawLayer | null)[] = layers.slice();
  const sortedLayers = new Set<ExcalidrawLayer>();

  origLayers.forEach((layer, idx) => {
    if (!layer) {
      return;
    }
    if (layer.boundLayers?.length) {
      sortedLayers.add(layer);
      origLayers[idx] = null;
      layer.boundLayers.forEach((boundLayer) => {
        const child = layersMap.get(boundLayer.id);
        if (child && boundLayer.type === "text") {
          sortedLayers.add(child[0]);
          origLayers[child[1]] = null;
        }
      });
    } else if (layer.type === "text" && layer.containerId) {
      const parent = layersMap.get(layer.containerId);
      if (!parent?.[0].boundLayers?.find((x) => x.id === layer.id)) {
        sortedLayers.add(layer);
        origLayers[idx] = null;

        // if layer has a container and container lists it, skip this layer
        // as it'll be taken care of by the container
      }
    } else {
      sortedLayers.add(layer);
      origLayers[idx] = null;
    }
  });

  // if there's a bug which resulted in losing some of the layers, return
  // original instead as that's better than losing data
  if (sortedLayers.size !== layers.length) {
    console.error("normalizeBoundLayersOrder: lost some layers... bailing!");
    return layers;
  }

  return [...sortedLayers];
};

export const normalizeLayerOrder = (layers: readonly ExcalidrawLayer[]) => {
  // console.time();
  const ret = normalizeBoundLayersOrder(normalizeGroupLayerOrder(layers));
  // console.timeEnd();
  return ret;
};
