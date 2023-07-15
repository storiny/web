import { getSelectedLayers } from "../../lib/scene";
import { KEYS } from "../keys";
import { newLayerWith } from "../layer/mutateLayer";
import { ExcalidrawLayer } from "../layer/types";
import { arrayToMap } from "../utils";
import { register } from "./register";

const shouldLock = (layers: readonly ExcalidrawLayer[]) =>
  layers.every((el) => !el.locked);

export const actionToggleLayerLock = register({
  name: "toggleLayerLock",
  trackEvent: { category: "layer" },
  predicate: (layers, appState) => {
    const selectedLayers = getSelectedLayers(layers, appState);
    return !selectedLayers.some((layer) => layer.locked && layer.frameId);
  },
  perform: (layers, appState) => {
    const selectedLayers = getSelectedLayers(layers, appState, {
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
      appState: {
        ...appState,
        selectedLinearLayer: nextLockState ? null : appState.selectedLinearLayer
      },
      commitToHistory: true
    };
  },
  contextItemLabel: (layers, appState) => {
    const selected = getSelectedLayers(layers, appState, {
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
  keyTest: (event, appState, layers) =>
    event.key.toLocaleLowerCase() === KEYS.L &&
    event[KEYS.CTRL_OR_CMD] &&
    event.shiftKey &&
    getSelectedLayers(layers, appState, {
      includeBoundTextLayer: false
    }).length > 0
});

export const actionUnlockAllLayers = register({
  name: "unlockAllLayers",
  trackEvent: { category: "canvas" },
  viewMode: false,
  predicate: (layers) => layers.some((layer) => layer.locked),
  perform: (layers, appState) => {
    const lockedLayers = layers.filter((el) => el.locked);

    return {
      layers: layers.map((layer) => {
        if (layer.locked) {
          return newLayerWith(layer, { locked: false });
        }
        return layer;
      }),
      appState: {
        ...appState,
        selectedLayerIds: Object.fromEntries(
          lockedLayers.map((el) => [el.id, true])
        )
      },
      commitToHistory: true
    };
  },
  contextItemLabel: "labels.layerLock.unlockAll"
});
