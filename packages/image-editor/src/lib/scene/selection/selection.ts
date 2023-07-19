import { LayerType } from "../../../constants";
import { EditorState, Layer, NonDeletedLayer } from "../../../types";
import {
  getLayerAbsoluteCoords,
  getLayerBounds,
  isBoundToContainer
} from "../../layer";
import { isShallowEqual } from "../../utils";

/**
 * Returns the layers within selection
 * @param layers Layers
 * @param selection Selection
 */
export const getLayersWithinSelection = (
  layers: readonly NonDeletedLayer[],
  selection: NonDeletedLayer
): NonDeletedLayer[] => {
  const [selectionX1, selectionY1, selectionX2, selectionY2] =
    getLayerAbsoluteCoords(selection);

  return layers.filter((layer) => {
    let [layerX1, layerY1, layerX2, layerY2] = getLayerBounds(layer);

    return (
      !layer.locked &&
      layer.type !== LayerType.SELECTION &&
      !isBoundToContainer(layer) &&
      selectionX1 <= layerX1 &&
      selectionY1 <= layerY1 &&
      selectionX2 >= layerX2 &&
      selectionY2 >= layerY2
    );
  });
};

// FIXME move this into the editor instance to keep utility methods stateless
export const isSomeLayerSelected = ((): ((
  layers: readonly NonDeletedLayer[],
  editorState: Pick<EditorState, "selectedLayerIds">
) => boolean) => {
  let lastLayers: readonly NonDeletedLayer[] | null = null;
  let lastSelectedLayerIds: EditorState["selectedLayerIds"] | null = null;
  let isSelected: boolean | null = null;

  const ret = (
    layers: readonly NonDeletedLayer[],
    editorState: Pick<EditorState, "selectedLayerIds">
  ): boolean => {
    if (
      isSelected != null &&
      layers === lastLayers &&
      editorState.selectedLayerIds === lastSelectedLayerIds
    ) {
      return isSelected;
    }

    isSelected = layers.some((layer) => editorState.selectedLayerIds[layer.id]);
    lastLayers = layers;
    lastSelectedLayerIds = editorState.selectedLayerIds;

    return isSelected;
  };

  ret.clearCache = (): void => {
    lastLayers = null;
    lastSelectedLayerIds = null;
    isSelected = null;
  };

  return ret;
})();

/**
 * Returns common attribute (picked by `getAttribute` callback) of the
 * selected layers. If the layers do not share the same value, `null` will
 * be returned
 * @param layers Layers
 * @param editorState Editor state
 * @param getAttribute Get attribute callback
 */
export const getCommonAttributeOfSelectedLayers = <T>(
  layers: readonly NonDeletedLayer[],
  editorState: Pick<EditorState, "selectedLayerIds">,
  getAttribute: (layer: Layer) => T
): T | null => {
  const attributes = Array.from(
    new Set(getSelectedLayers(layers, editorState).map(getAttribute))
  );

  return attributes.length === 1 ? attributes[0] : null;
};

/**
 * Returns the selected layers
 * @param layers Layers
 * @param editorState Editor state
 * @param opts Options
 */
export const getSelectedLayers = (
  layers: readonly NonDeletedLayer[],
  editorState: Pick<EditorState, "selectedLayerIds">,
  opts?: {
    includeBoundTextLayer?: boolean;
  }
): NonDeletedLayer[] =>
  layers.filter((layer) => {
    if (editorState.selectedLayerIds[layer.id]) {
      return layer;
    }

    if (
      opts?.includeBoundTextLayer &&
      isBoundToContainer(layer) &&
      editorState.selectedLayerIds[layer?.containerId]
    ) {
      return layer;
    }

    return null;
  });

/**
 * Returns the target layers
 * @param layers Layers
 * @param editorState Editor state
 */
export const getTargetLayers = (
  layers: readonly NonDeletedLayer[],
  editorState: Pick<EditorState, "selectedLayerIds" | "editingLayer">
): NonDeletedLayer[] =>
  editorState.editingLayer
    ? [editorState.editingLayer]
    : getSelectedLayers(layers, editorState, {
        includeBoundTextLayer: true
      });

/**
 * Returns prevState's selectedLayerIds if they are unchanged, so as they
 * retain referenec identity for memoization
 * @param nextSelectedLayerIds New selected layer ids
 * @param prevState Previous state
 */
export const makeNextSelectedLayerIds = (
  nextSelectedLayerIds: EditorState["selectedLayerIds"],
  prevState: Pick<EditorState, "selectedLayerIds">
): Readonly<{ [p: string]: true }> => {
  if (isShallowEqual(prevState.selectedLayerIds, nextSelectedLayerIds)) {
    return prevState.selectedLayerIds;
  }

  return nextSelectedLayerIds;
};
