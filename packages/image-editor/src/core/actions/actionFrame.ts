import { getSelectedLayers } from "../../lib/scene";
import { removeAllLayersFromFrame } from "../frame";
import { getFrameLayers } from "../frame";
import { KEYS } from "../keys";
import { getNonDeletedLayers } from "../layer";
import { ExcalidrawLayer } from "../layer/types";
import { AppState } from "../types";
import { setCursorForShape, updateActiveTool } from "../utils";
import { register } from "./register";

const isSingleFrameSelected = (
  layers: readonly ExcalidrawLayer[],
  appState: AppState
) => {
  const selectedLayers = getSelectedLayers(
    getNonDeletedLayers(layers),
    appState
  );

  return selectedLayers.length === 1 && selectedLayers[0].type === "frame";
};

export const actionSelectAllLayersInFrame = register({
  name: "selectAllLayersInFrame",
  trackEvent: { category: "canvas" },
  perform: (layers, appState) => {
    const selectedFrame = getSelectedLayers(
      getNonDeletedLayers(layers),
      appState
    )[0];

    if (selectedFrame && selectedFrame.type === "frame") {
      const layersInFrame = getFrameLayers(
        getNonDeletedLayers(layers),
        selectedFrame.id
      ).filter((layer) => !(layer.type === "text" && layer.containerId));

      return {
        layers,
        appState: {
          ...appState,
          selectedLayerIds: layersInFrame.reduce((acc, layer) => {
            acc[layer.id] = true;
            return acc;
          }, {} as Record<ExcalidrawLayer["id"], true>)
        },
        commitToHistory: false
      };
    }

    return {
      layers,
      appState,
      commitToHistory: false
    };
  },
  contextItemLabel: "labels.selectAllLayersInFrame",
  predicate: (layers, appState) => isSingleFrameSelected(layers, appState)
});

export const actionRemoveAllLayersFromFrame = register({
  name: "removeAllLayersFromFrame",
  trackEvent: { category: "history" },
  perform: (layers, appState) => {
    const selectedFrame = getSelectedLayers(
      getNonDeletedLayers(layers),
      appState
    )[0];

    if (selectedFrame && selectedFrame.type === "frame") {
      return {
        layers: removeAllLayersFromFrame(layers, selectedFrame, appState),
        appState: {
          ...appState,
          selectedLayerIds: {
            [selectedFrame.id]: true
          }
        },
        commitToHistory: true
      };
    }

    return {
      layers,
      appState,
      commitToHistory: false
    };
  },
  contextItemLabel: "labels.removeAllLayersFromFrame",
  predicate: (layers, appState) => isSingleFrameSelected(layers, appState)
});

export const actionupdateFrameRendering = register({
  name: "updateFrameRendering",
  viewMode: true,
  trackEvent: { category: "canvas" },
  perform: (layers, appState) => ({
    layers,
    appState: {
      ...appState,
      frameRendering: {
        ...appState.frameRendering,
        enabled: !appState.frameRendering.enabled
      }
    },
    commitToHistory: false
  }),
  contextItemLabel: "labels.updateFrameRendering",
  checked: (appState: AppState) => appState.frameRendering.enabled
});

export const actionSetFrameAsActiveTool = register({
  name: "setFrameAsActiveTool",
  trackEvent: { category: "toolbar" },
  perform: (layers, appState, _, app) => {
    const nextActiveTool = updateActiveTool(appState, {
      type: "frame"
    });

    setCursorForShape(app.canvas, {
      ...appState,
      activeTool: nextActiveTool
    });

    return {
      layers,
      appState: {
        ...appState,
        activeTool: updateActiveTool(appState, {
          type: "frame"
        })
      },
      commitToHistory: false
    };
  },
  keyTest: (event) =>
    !event[KEYS.CTRL_OR_CMD] &&
    !event.shiftKey &&
    !event.altKey &&
    event.key.toLocaleLowerCase() === KEYS.F
});
