import { getSelectedLayers } from "../../lib/scene";
import { arrayToMap } from "../../lib/utils/utils";
import { KEYS } from "../keys";
import { newLayerWith } from "../layer/mutateLayer";
import { ExcalidrawLayer } from "../layer/types";
import { register } from "./register";

const shouldLock = (layers: readonly ExcalidrawLayer[]) =>
  layers.every((el) => !el.locked);

export const actionToggleLayerLock = register({
  name: "toggleLayerLock",
  trackEvent: { category: "layer" },
  predicate: (layers, editorState) => {
    const selectedLayers = getSelectedLayers(layers, editorState);
    return !selectedLayers.some((layer) => layer.locked && layer.frameId);
  },
  perform: (layers, editorState) => {
    const selectedLayers = getSelectedLayers(layers, editorState, {
      includeBoundTextLayer: true,
      includeLayersInFrames: true
    });

    if (!selectedLayers.length) {
      return false;
    }

    const nextLockState = shouldLock(selectedLayers);
    const selectedLayersMap = arrayToMap(selectedLayers);
    return {
      layers: layers.map((layer) => {
        if (!selectedLayersMap.has(layer.id)) {
          return layer;
        }

        return newLayerWith(layer, { locked: nextLockState });
      }),
      editorState: {
        ...editorState,
        selectedLinearLayer: nextLockState
          ? null
          : editorState.selectedLinearLayer
      },
      commitToHistory: true
    };
  },
  contextItemLabel: (layers, editorState) => {
    const selected = getSelectedLayers(layers, editorState, {
      includeBoundTextLayer: false
    });
    if (selected.length === 1 && selected[0].type !== "frame") {
      return selected[0].locked
        ? "labels.layerLock.unlock"
        : "labels.layerLock.lock";
    }

    return shouldLock(selected)
      ? "labels.layerLock.lockAll"
      : "labels.layerLock.unlockAll";
  },
  keyTest: (event, editorState, layers) =>
    event.key.toLocaleLowerCase() === KEYS.L &&
    event[KEYS.CTRL_OR_CMD] &&
    event.shiftKey &&
    getSelectedLayers(layers, editorState, {
      includeBoundTextLayer: false
    }).length > 0
});

export const actionUnlockAllLayers = register({
  name: "unlockAllLayers",
  trackEvent: { category: "canvas" },
  viewMode: false,
  predicate: (layers) => layers.some((layer) => layer.locked),
  perform: (layers, editorState) => {
    const lockedLayers = layers.filter((el) => el.locked);

    return {
      layers: layers.map((layer) => {
        if (layer.locked) {
          return newLayerWith(layer, { locked: false });
        }
        return layer;
      }),
      editorState: {
        ...editorState,
        selectedLayerIds: Object.fromEntries(
          lockedLayers.map((el) => [el.id, true])
        )
      },
      commitToHistory: true
    };
  },
  contextItemLabel: "labels.layerLock.unlockAll"
});
