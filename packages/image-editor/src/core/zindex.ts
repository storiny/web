import { getSelectedLayers } from "../lib/scene";
import Scene from "../lib/scene/Scene";
import { groupByFrames } from "./frame";
import { getLayersInGroup } from "./groups";
import { bumpUpdate } from "./layer/mutateLayer";
import { isFrameLayer } from "./layer/typeChecks";
import { ExcalidrawLayer } from "./layer/types";
import { AppState } from "./types";
import { arrayToMap, findIndex, findLastIndex } from "./utils";

// layers that do not belong to a frame are considered a root layer
const isRootLayer = (layer: ExcalidrawLayer) => !layer.frameId;

/**
 * Returns indices of layers to move based on selected layers.
 * Includes contiguous deleted layers that are between two selected layers,
 *  e.g.: [0 (selected), 1 (deleted), 2 (deleted), 3 (selected)]
 *
 * Specified layers (layersToBeMoved) take precedence over
 * appState.selectedLayersIds
 */
const getIndicesToMove = (
  layers: readonly ExcalidrawLayer[],
  appState: AppState,
  layersToBeMoved?: readonly ExcalidrawLayer[]
) => {
  let selectedIndices: number[] = [];
  let deletedIndices: number[] = [];
  let includeDeletedIndex = null;
  let index = -1;
  const selectedLayerIds = arrayToMap(
    layersToBeMoved
      ? layersToBeMoved
      : getSelectedLayers(layers, appState, {
          includeBoundTextLayer: true
        })
  );
  while (++index < layers.length) {
    const layer = layers[index];
    if (selectedLayerIds.get(layer.id)) {
      if (deletedIndices.length) {
        selectedIndices = selectedIndices.concat(deletedIndices);
        deletedIndices = [];
      }
      selectedIndices.push(index);
      includeDeletedIndex = index + 1;
    } else if (layer.isDeleted && includeDeletedIndex === index) {
      includeDeletedIndex = index + 1;
      deletedIndices.push(index);
    } else {
      deletedIndices = [];
    }
  }
  return selectedIndices;
};

const toContiguousGroups = (array: number[]) => {
  let cursor = 0;
  return array.reduce((acc, value, index) => {
    if (index > 0 && array[index - 1] !== value - 1) {
      cursor = ++cursor;
    }
    (acc[cursor] || (acc[cursor] = [])).push(value);
    return acc;
  }, [] as number[][]);
};

/**
 * @returns index of target layer, consindering tightly-bound layers
 * (currently non-linear layers bound to a container) as a one unit.
 * If no binding present, returns `undefined`.
 */
const getTargetIndexAccountingForBinding = (
  nextLayer: ExcalidrawLayer,
  layers: readonly ExcalidrawLayer[],
  direction: "left" | "right"
) => {
  if ("containerId" in nextLayer && nextLayer.containerId) {
    if (direction === "left") {
      const containerLayer = Scene.getScene(nextLayer)!.getLayer(
        nextLayer.containerId
      );
      if (containerLayer) {
        return layers.indexOf(containerLayer);
      }
    } else {
      return layers.indexOf(nextLayer);
    }
  } else {
    const boundLayerId = nextLayer.boundLayers?.find(
      (binding) => binding.type !== "arrow"
    )?.id;
    if (boundLayerId) {
      if (direction === "left") {
        return layers.indexOf(nextLayer);
      }
      const boundTextLayer = Scene.getScene(nextLayer)!.getLayer(boundLayerId);

      if (boundTextLayer) {
        return layers.indexOf(boundTextLayer);
      }
    }
  }
};

/**
 * Returns next candidate index that's available to be moved to. Currently that
 *  is a non-deleted layer, and not inside a group (unless we're editing it).
 */
const getTargetIndex = (
  appState: AppState,
  layers: readonly ExcalidrawLayer[],
  boundaryIndex: number,
  direction: "left" | "right"
) => {
  const sourceLayer = layers[boundaryIndex];

  const indexFilter = (layer: ExcalidrawLayer) => {
    if (layer.isDeleted) {
      return false;
    }
    // if we're editing group, find closest sibling irrespective of whether
    // there's a different-group layer between them (for legacy reasons)
    if (appState.editingGroupId) {
      return layer.groupIds.includes(appState.editingGroupId);
    }
    return true;
  };

  const candidateIndex =
    direction === "left"
      ? findLastIndex(layers, indexFilter, Math.max(0, boundaryIndex - 1))
      : findIndex(layers, indexFilter, boundaryIndex + 1);

  const nextLayer = layers[candidateIndex];

  if (!nextLayer) {
    return -1;
  }

  if (appState.editingGroupId) {
    if (
      // candidate layer is a sibling in current editing group → return
      sourceLayer?.groupIds.join("") === nextLayer?.groupIds.join("")
    ) {
      return (
        getTargetIndexAccountingForBinding(nextLayer, layers, direction) ??
        candidateIndex
      );
    } else if (!nextLayer?.groupIds.includes(appState.editingGroupId)) {
      // candidate layer is outside current editing group → prevent
      return -1;
    }
  }

  if (!nextLayer.groupIds.length) {
    return (
      getTargetIndexAccountingForBinding(nextLayer, layers, direction) ??
      candidateIndex
    );
  }

  const siblingGroupId = appState.editingGroupId
    ? nextLayer.groupIds[
        nextLayer.groupIds.indexOf(appState.editingGroupId) - 1
      ]
    : nextLayer.groupIds[nextLayer.groupIds.length - 1];

  const layersInSiblingGroup = getLayersInGroup(layers, siblingGroupId);

  if (layersInSiblingGroup.length) {
    // assumes getLayersInGroup() returned layers are sorted
    // by zIndex (ascending)
    return direction === "left"
      ? layers.indexOf(layersInSiblingGroup[0])
      : layers.indexOf(layersInSiblingGroup[layersInSiblingGroup.length - 1]);
  }

  return candidateIndex;
};

const getTargetLayersMap = <T extends ExcalidrawLayer>(
  layers: readonly T[],
  indices: number[]
) =>
  indices.reduce((acc, index) => {
    const layer = layers[index];
    acc[layer.id] = layer;
    return acc;
  }, {} as Record<string, ExcalidrawLayer>);

const _shiftLayers = (
  layers: readonly ExcalidrawLayer[],
  appState: AppState,
  direction: "left" | "right",
  layersToBeMoved?: readonly ExcalidrawLayer[]
) => {
  const indicesToMove = getIndicesToMove(layers, appState, layersToBeMoved);
  const targetLayersMap = getTargetLayersMap(layers, indicesToMove);
  let groupedIndices = toContiguousGroups(indicesToMove);

  if (direction === "right") {
    groupedIndices = groupedIndices.reverse();
  }

  groupedIndices.forEach((indices, i) => {
    const leadingIndex = indices[0];
    const trailingIndex = indices[indices.length - 1];
    const boundaryIndex = direction === "left" ? leadingIndex : trailingIndex;

    const targetIndex = getTargetIndex(
      appState,
      layers,
      boundaryIndex,
      direction
    );

    if (targetIndex === -1 || boundaryIndex === targetIndex) {
      return;
    }

    const leadingLayers =
      direction === "left"
        ? layers.slice(0, targetIndex)
        : layers.slice(0, leadingIndex);
    const targetLayers = layers.slice(leadingIndex, trailingIndex + 1);
    const displacedLayers =
      direction === "left"
        ? layers.slice(targetIndex, leadingIndex)
        : layers.slice(trailingIndex + 1, targetIndex + 1);
    const trailingLayers =
      direction === "left"
        ? layers.slice(trailingIndex + 1)
        : layers.slice(targetIndex + 1);

    layers =
      direction === "left"
        ? [
            ...leadingLayers,
            ...targetLayers,
            ...displacedLayers,
            ...trailingLayers
          ]
        : [
            ...leadingLayers,
            ...displacedLayers,
            ...targetLayers,
            ...trailingLayers
          ];
  });

  return layers.map((layer) => {
    if (targetLayersMap[layer.id]) {
      return bumpUpdate(layer);
    }
    return layer;
  });
};

const shiftLayers = (
  appState: AppState,
  layers: readonly ExcalidrawLayer[],
  direction: "left" | "right",
  layersToBeMoved?: readonly ExcalidrawLayer[]
) => shift(layers, appState, direction, _shiftLayers, layersToBeMoved);

const _shiftLayersToEnd = (
  layers: readonly ExcalidrawLayer[],
  appState: AppState,
  direction: "left" | "right"
) => {
  const indicesToMove = getIndicesToMove(layers, appState);
  const targetLayersMap = getTargetLayersMap(layers, indicesToMove);
  const displacedLayers: ExcalidrawLayer[] = [];

  let leadingIndex: number;
  let trailingIndex: number;
  if (direction === "left") {
    if (appState.editingGroupId) {
      const groupLayers = getLayersInGroup(layers, appState.editingGroupId);
      if (!groupLayers.length) {
        return layers;
      }
      leadingIndex = layers.indexOf(groupLayers[0]);
    } else {
      leadingIndex = 0;
    }

    trailingIndex = indicesToMove[indicesToMove.length - 1];
  } else {
    if (appState.editingGroupId) {
      const groupLayers = getLayersInGroup(layers, appState.editingGroupId);
      if (!groupLayers.length) {
        return layers;
      }
      trailingIndex = layers.indexOf(groupLayers[groupLayers.length - 1]);
    } else {
      trailingIndex = layers.length - 1;
    }

    leadingIndex = indicesToMove[0];
  }

  for (let index = leadingIndex; index < trailingIndex + 1; index++) {
    if (!indicesToMove.includes(index)) {
      displacedLayers.push(layers[index]);
    }
  }

  const targetLayers = Object.values(targetLayersMap).map((layer) =>
    bumpUpdate(layer)
  );

  const leadingLayers = layers.slice(0, leadingIndex);
  const trailingLayers = layers.slice(trailingIndex + 1);

  return direction === "left"
    ? [...leadingLayers, ...targetLayers, ...displacedLayers, ...trailingLayers]
    : [
        ...leadingLayers,
        ...displacedLayers,
        ...targetLayers,
        ...trailingLayers
      ];
};

const shiftLayersToEnd = (
  layers: readonly ExcalidrawLayer[],
  appState: AppState,
  direction: "left" | "right",
  layersToBeMoved?: readonly ExcalidrawLayer[]
) => shift(layers, appState, direction, _shiftLayersToEnd, layersToBeMoved);

const shift = (
  layers: readonly ExcalidrawLayer[],
  appState: AppState,
  direction: "left" | "right",
  shiftFunction: (
    layers: ExcalidrawLayer[],
    appState: AppState,
    direction: "left" | "right",
    layersToBeMoved?: readonly ExcalidrawLayer[]
  ) => ExcalidrawLayer[] | readonly ExcalidrawLayer[],
  layersToBeMoved?: readonly ExcalidrawLayer[]
) => {
  const layersMap = arrayToMap(layers);
  const frameLayersMap = groupByFrames(layers);

  // in case root is non-existent, we promote children layers to root
  let rootLayers = layers.filter(
    (layer) =>
      isRootLayer(layer) || (layer.frameId && !layersMap.has(layer.frameId))
  );
  // and remove non-existet root
  for (const frameId of frameLayersMap.keys()) {
    if (!layersMap.has(frameId)) {
      frameLayersMap.delete(frameId);
    }
  }

  // shift the root layers first
  rootLayers = shiftFunction(
    rootLayers,
    appState,
    direction,
    layersToBeMoved
  ) as ExcalidrawLayer[];

  // shift the layers in frames if needed
  frameLayersMap.forEach((frameLayers, frameId) => {
    if (!appState.selectedLayerIds[frameId]) {
      frameLayersMap.set(
        frameId,
        shiftFunction(
          frameLayers,
          appState,
          direction,
          layersToBeMoved
        ) as ExcalidrawLayer[]
      );
    }
  });

  // return the final layers
  let finalLayers: ExcalidrawLayer[] = [];

  rootLayers.forEach((layer) => {
    if (isFrameLayer(layer)) {
      finalLayers = [
        ...finalLayers,
        ...(frameLayersMap.get(layer.id) ?? []),
        layer
      ];
    } else {
      finalLayers = [...finalLayers, layer];
    }
  });

  return finalLayers;
};

// public API
// -----------------------------------------------------------------------------

export const moveOneLeft = (
  layers: readonly ExcalidrawLayer[],
  appState: AppState,
  layersToBeMoved?: readonly ExcalidrawLayer[]
) => shiftLayers(appState, layers, "left", layersToBeMoved);

export const moveOneRight = (
  layers: readonly ExcalidrawLayer[],
  appState: AppState,
  layersToBeMoved?: readonly ExcalidrawLayer[]
) => shiftLayers(appState, layers, "right", layersToBeMoved);

export const moveAllLeft = (
  layers: readonly ExcalidrawLayer[],
  appState: AppState,
  layersToBeMoved?: readonly ExcalidrawLayer[]
) => shiftLayersToEnd(layers, appState, "left", layersToBeMoved);

export const moveAllRight = (
  layers: readonly ExcalidrawLayer[],
  appState: AppState,
  layersToBeMoved?: readonly ExcalidrawLayer[]
) => shiftLayersToEnd(layers, appState, "right", layersToBeMoved);
