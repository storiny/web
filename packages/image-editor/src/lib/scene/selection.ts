import {
  getContainingFrame,
  getFrameLayers,
  layerOverlapsWithFrame
} from "../../core/frame";
import { getLayerAbsoluteCoords, getLayerBounds } from "../../core/layer";
import { isBoundToContainer } from "../../core/layer/typeChecks";
import {
  ExcalidrawLayer,
  NonDeletedExcalidrawLayer
} from "../../core/layer/types";
import { AppState } from "../../core/types";
import { isShallowEqual } from "../../core/utils";

/**
 * Frames and their containing layers are not to be selected at the same time.
 * Given an array of selected layers, if there are frames and their containing layers
 * we only keep the frames.
 * @param selectedLayers
 */
export const excludeLayersInFramesFromSelection = <T extends ExcalidrawLayer>(
  selectedLayers: readonly T[]
) => {
  const framesInSelection = new Set<T["id"]>();

  selectedLayers.forEach((layer) => {
    if (layer.type === "frame") {
      framesInSelection.add(layer.id);
    }
  });

  return selectedLayers.filter((layer) => {
    if (layer.frameId && framesInSelection.has(layer.frameId)) {
      return false;
    }
    return true;
  });
};

export const getLayersWithinSelection = (
  layers: readonly NonDeletedExcalidrawLayer[],
  selection: NonDeletedExcalidrawLayer,
  excludeLayersInFrames: boolean = true
) => {
  const [selectionX1, selectionY1, selectionX2, selectionY2] =
    getLayerAbsoluteCoords(selection);

  let layersInSelection = layers.filter((layer) => {
    let [layerX1, layerY1, layerX2, layerY2] = getLayerBounds(layer);

    const containingFrame = getContainingFrame(layer);
    if (containingFrame) {
      const [fx1, fy1, fx2, fy2] = getLayerBounds(containingFrame);

      layerX1 = Math.max(fx1, layerX1);
      layerY1 = Math.max(fy1, layerY1);
      layerX2 = Math.min(fx2, layerX2);
      layerY2 = Math.min(fy2, layerY2);
    }

    return (
      layer.locked === false &&
      layer.type !== "selection" &&
      !isBoundToContainer(layer) &&
      selectionX1 <= layerX1 &&
      selectionY1 <= layerY1 &&
      selectionX2 >= layerX2 &&
      selectionY2 >= layerY2
    );
  });

  layersInSelection = excludeLayersInFrames
    ? excludeLayersInFramesFromSelection(layersInSelection)
    : layersInSelection;

  layersInSelection = layersInSelection.filter((layer) => {
    const containingFrame = getContainingFrame(layer);

    if (containingFrame) {
      return layerOverlapsWithFrame(layer, containingFrame);
    }

    return true;
  });

  return layersInSelection;
};

// FIXME move this into the editor instance to keep utility methods stateless
export const isSomeLayerSelected = (() => {
  let lastLayers: readonly NonDeletedExcalidrawLayer[] | null = null;
  let lastSelectedLayerIds: AppState["selectedLayerIds"] | null = null;
  let isSelected: boolean | null = null;

  const ret = (
    layers: readonly NonDeletedExcalidrawLayer[],
    appState: Pick<AppState, "selectedLayerIds">
  ): boolean => {
    if (
      isSelected != null &&
      layers === lastLayers &&
      appState.selectedLayerIds === lastSelectedLayerIds
    ) {
      return isSelected;
    }

    isSelected = layers.some((layer) => appState.selectedLayerIds[layer.id]);
    lastLayers = layers;
    lastSelectedLayerIds = appState.selectedLayerIds;

    return isSelected;
  };

  ret.clearCache = () => {
    lastLayers = null;
    lastSelectedLayerIds = null;
    isSelected = null;
  };

  return ret;
})();

/**
 * Returns common attribute (picked by `getAttribute` callback) of selected
 *  layers. If layers don't share the same value, returns `null`.
 */
export const getCommonAttributeOfSelectedLayers = <T>(
  layers: readonly NonDeletedExcalidrawLayer[],
  appState: Pick<AppState, "selectedLayerIds">,
  getAttribute: (layer: ExcalidrawLayer) => T
): T | null => {
  const attributes = Array.from(
    new Set(
      getSelectedLayers(layers, appState).map((layer) => getAttribute(layer))
    )
  );
  return attributes.length === 1 ? attributes[0] : null;
};

export const getSelectedLayers = (
  layers: readonly NonDeletedExcalidrawLayer[],
  appState: Pick<AppState, "selectedLayerIds">,
  opts?: {
    includeBoundTextLayer?: boolean;
    includeLayersInFrames?: boolean;
  }
) => {
  const selectedLayers = layers.filter((layer) => {
    if (appState.selectedLayerIds[layer.id]) {
      return layer;
    }
    if (
      opts?.includeBoundTextLayer &&
      isBoundToContainer(layer) &&
      appState.selectedLayerIds[layer?.containerId]
    ) {
      return layer;
    }
    return null;
  });

  if (opts?.includeLayersInFrames) {
    const layersToInclude: ExcalidrawLayer[] = [];
    selectedLayers.forEach((layer) => {
      if (layer.type === "frame") {
        getFrameLayers(layers, layer.id).forEach((e) =>
          layersToInclude.push(e)
        );
      }
      layersToInclude.push(layer);
    });

    return layersToInclude;
  }

  return selectedLayers;
};

export const getTargetLayers = (
  layers: readonly NonDeletedExcalidrawLayer[],
  appState: Pick<AppState, "selectedLayerIds" | "editingLayer">
) =>
  appState.editingLayer
    ? [appState.editingLayer]
    : getSelectedLayers(layers, appState, {
        includeBoundTextLayer: true
      });

/**
 * returns prevState's selectedLayerids if no change from previous, so as to
 * retain reference identity for memoization
 */
export const makeNextSelectedLayerIds = (
  nextSelectedLayerIds: AppState["selectedLayerIds"],
  prevState: Pick<AppState, "selectedLayerIds">
) => {
  if (isShallowEqual(prevState.selectedLayerIds, nextSelectedLayerIds)) {
    return prevState.selectedLayerIds;
  }

  return nextSelectedLayerIds;
};
