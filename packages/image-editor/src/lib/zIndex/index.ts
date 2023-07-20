import { LayerType } from "../../constants";
import { EditorState, Layer } from "../../types";
import { getLayersInGroup } from "../group";
import { bumpUpdate } from "../layer";
import { getSelectedLayers, Scene } from "../scene";
import { arrayToMap, findIndex, findLastIndex } from "../utils";

/**
 * Returns the indices of layers to move based on selected layers. Includes
 * contiguous deleted layers that are between two selected layers
 * @param layers Layers
 * @param editorState Editor state
 * @param layersToBeMoved Layer to move
 */
const getIndicesToMove = (
  layers: readonly Layer[],
  editorState: EditorState,
  layersToBeMoved?: readonly Layer[]
): number[] => {
  let selectedIndices: number[] = [];
  let deletedIndices: number[] = [];
  let includeDeletedIndex = null;
  let index = -1;
  const selectedLayerIds = arrayToMap(
    layersToBeMoved
      ? layersToBeMoved
      : getSelectedLayers(layers, editorState, {
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

/**
 * Contiguous groups
 * @param array Array
 */
const toContiguousGroups = (array: number[]): number[][] => {
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
 * Returns the index of target layer, considering tightly-bound layers
 * (currently non-linear layers bound to a container) as a single unit.
 * If no binding layer is present, returns `undefined`
 * @param nextLayer Next layer
 * @param layers Layers
 * @param direction Direction
 */
const getTargetIndexAccountingForBinding = (
  nextLayer: Layer,
  layers: readonly Layer[],
  direction: "left" | "right"
): number | undefined => {
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
      (binding) => binding.type !== LayerType.ARROW
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
 * Returns the next candidate index that is available to be moved,
 * commonly a non-deleted layer that is not inside a group (unless the
 * use if editing it)
 * @param editorState Editor state
 * @param layers Layers
 * @param boundaryIndex Boundary index
 * @param direction Direction
 */
const getTargetIndex = (
  editorState: EditorState,
  layers: readonly Layer[],
  boundaryIndex: number,
  direction: "left" | "right"
): number => {
  const sourceLayer = layers[boundaryIndex];

  // const indexFilter = (layer: Layer): boolean => {
  //   if (layer.isDeleted) {
  //     return false;
  //   }
  //
  //   // If we're editing a group, find the closest sibling irrespective of whether
  //   // there's a different group layer between them (for legacy reasons)
  //   if (editorState.editingGroupId) {
  //     return layer.groupIds.includes(editorState.editingGroupId);
  //   }
  //
  //   return true;
  // };

  const candidateIndex =
    direction === "left"
      ? findLastIndex(
          layers,
          (layer) => !layer.isDeleted,
          Math.max(0, boundaryIndex - 1)
        )
      : findIndex(layers, (layer) => !layer.isDeleted, boundaryIndex + 1);
  const nextLayer = layers[candidateIndex];

  if (!nextLayer) {
    return -1;
  }

  if (editorState.editingGroupId) {
    if (
      // Candidate layer is a sibling in current editing group
      sourceLayer?.groupIds.join("") === nextLayer?.groupIds.join("")
    ) {
      return (
        getTargetIndexAccountingForBinding(nextLayer, layers, direction) ??
        candidateIndex
      );
    } else if (!nextLayer?.groupIds.includes(editorState.editingGroupId)) {
      // Candidate layer is outside current editing group
      return -1;
    }
  }

  if (!nextLayer.groupIds.length) {
    return (
      getTargetIndexAccountingForBinding(nextLayer, layers, direction) ??
      candidateIndex
    );
  }

  const siblingGroupId = editorState.editingGroupId
    ? nextLayer.groupIds[
        nextLayer.groupIds.indexOf(editorState.editingGroupId) - 1
      ]
    : nextLayer.groupIds[nextLayer.groupIds.length - 1];
  const layersInSiblingGroup = getLayersInGroup(layers, siblingGroupId);

  if (layersInSiblingGroup.length) {
    // Assumes `getLayersInGroup` returned layers that are sorted
    // by zIndex (ascending)
    return direction === "left"
      ? layers.indexOf(layersInSiblingGroup[0])
      : layers.indexOf(layersInSiblingGroup[layersInSiblingGroup.length - 1]);
  }

  return candidateIndex;
};

/**
 * Returns target layers map
 * @param layers Layers
 * @param indices Indices
 */
const getTargetLayersMap = <T extends Layer>(
  layers: readonly T[],
  indices: number[]
): Record<string, Layer> =>
  indices.reduce((acc, index) => {
    const layer = layers[index];
    acc[layer.id] = layer;

    return acc;
  }, {} as Record<string, Layer>);

/**
 * Shifts layers to the specified direction
 * @param editorState
 * @param layers
 * @param direction
 * @param layersToBeMoved
 */
const shiftLayers = (
  editorState: EditorState,
  layers: Layer[],
  direction: "left" | "right",
  layersToBeMoved?: Layer[]
): Layer[] =>
  shift(
    layers,
    editorState,
    direction,
    (layers, editorState, direction, layersToBeMoved): Layer[] => {
      const indicesToMove = getIndicesToMove(
        layers,
        editorState,
        layersToBeMoved
      );
      const targetLayersMap = getTargetLayersMap(layers, indicesToMove);
      let groupedIndices = toContiguousGroups(indicesToMove);

      if (direction === "right") {
        groupedIndices = groupedIndices.reverse();
      }

      groupedIndices.forEach((indices) => {
        const leadingIndex = indices[0];
        const trailingIndex = indices[indices.length - 1];
        const boundaryIndex =
          direction === "left" ? leadingIndex : trailingIndex;
        const targetIndex = getTargetIndex(
          editorState,
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
    },
    layersToBeMoved
  );

/**
 * Shifts layers to the specified end
 * @param layers Layers
 * @param editorState Editor state
 * @param direction Direction to shift
 * @param layersToBeMoved Layers to move
 */
const shiftLayersToEnd = (
  layers: Layer[],
  editorState: EditorState,
  direction: "left" | "right",
  layersToBeMoved?: Layer[]
): Layer[] =>
  shift(
    layers,
    editorState,
    direction,
    (layers, editorState, direction): readonly Layer[] => {
      const indicesToMove = getIndicesToMove(layers, editorState);
      const targetLayersMap = getTargetLayersMap(layers, indicesToMove);
      const displacedLayers: Layer[] = [];
      let leadingIndex: number;
      let trailingIndex: number;

      if (direction === "left") {
        if (editorState.editingGroupId) {
          const groupLayers = getLayersInGroup(
            layers,
            editorState.editingGroupId
          );

          if (!groupLayers.length) {
            return layers;
          }

          leadingIndex = layers.indexOf(groupLayers[0]);
        } else {
          leadingIndex = 0;
        }

        trailingIndex = indicesToMove[indicesToMove.length - 1];
      } else {
        if (editorState.editingGroupId) {
          const groupLayers = getLayersInGroup(
            layers,
            editorState.editingGroupId
          );

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
    },
    layersToBeMoved
  );

/**
 * Shift layers using a callback
 * @param layers Layers
 * @param editorState Editor state
 * @param direction Direction
 * @param shiftFunction Shift function
 * @param layersToBeMoved Layers to shift
 */
const shift = (
  layers: Layer[],
  editorState: EditorState,
  direction: "left" | "right",
  shiftFunction: (
    layers: Layer[],
    editorState: EditorState,
    direction: "left" | "right",
    layersToBeMoved?: Layer[]
  ) => Layer[] | readonly Layer[],
  layersToBeMoved?: Layer[]
): Layer[] =>
  shiftFunction(layers, editorState, direction, layersToBeMoved) as Layer[];

/**
 * Moves a single layer to the left (backward)
 * @param layers Layers
 * @param editorState Editor state
 * @param layersToBeMoved Layers to move
 */
export const moveOneLeft = (
  layers: Layer[],
  editorState: EditorState,
  layersToBeMoved?: Layer[]
): Layer[] => shiftLayers(editorState, layers, "left", layersToBeMoved);

/**
 * Moves a single layer to the right (forward)
 * @param layers Layers
 * @param editorState Editor state
 * @param layersToBeMoved Layers to move
 */
export const moveOneRight = (
  layers: Layer[],
  editorState: EditorState,
  layersToBeMoved?: Layer[]
): Layer[] => shiftLayers(editorState, layers, "right", layersToBeMoved);

/**
 * Moves all the layers to the left (backwards)
 * @param layers Layers
 * @param editorState Editor state
 * @param layersToBeMoved Layers to move
 */
export const moveAllLeft = (
  layers: Layer[],
  editorState: EditorState,
  layersToBeMoved?: Layer[]
): Layer[] => shiftLayersToEnd(layers, editorState, "left", layersToBeMoved);

/**
 * Moves all the layers to the right (forwards)
 * @param layers Layers
 * @param editorState Editor state
 * @param layersToBeMoved Layers to move
 */
export const moveAllRight = (
  layers: Layer[],
  editorState: EditorState,
  layersToBeMoved?: Layer[]
): Layer[] => shiftLayersToEnd(layers, editorState, "right", layersToBeMoved);
