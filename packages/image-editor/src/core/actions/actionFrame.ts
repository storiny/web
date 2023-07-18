import { getSelectedLayers } from "../../lib/scene";
import { setCursorForShape, updateActiveTool } from "../../lib/utils/utils";
import { removeAllLayersFromFrame } from "../frame";
import { getFrameLayers } from "../frame";
import { KEYS } from "../keys";
import { getNonDeletedLayers } from "../layer";
import { ExcalidrawLayer } from "../layer/types";
import { AppState } from "../types";
import { register } from "./register";

const isSingleFrameSelected = (
  layers: readonly ExcalidrawLayer[],
  editorState: AppState
) => {
  const selectedLayers = getSelectedLayers(
    getNonDeletedLayers(layers),
    editorState
  );

  return selectedLayers.length === 1 && selectedLayers[0].type === "frame";
};

export const actionSelectAllLayersInFrame = register({
  name: "selectAllLayersInFrame",
  trackEvent: { category: "canvas" },
  perform: (layers, editorState) => {
    const selectedFrame = getSelectedLayers(
      getNonDeletedLayers(layers),
      editorState
    )[0];

    if (selectedFrame && selectedFrame.type === "frame") {
      const layersInFrame = getFrameLayers(
        getNonDeletedLayers(layers),
        selectedFrame.id
      ).filter((layer) => !(layer.type === "text" && layer.containerId));

      return {
        layers,
        editorState: {
          ...editorState,
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
      editorState,
      commitToHistory: false
    };
  },
  contextItemLabel: "labels.selectAllLayersInFrame",
  predicate: (layers, editorState) => isSingleFrameSelected(layers, editorState)
});

export const actionRemoveAllLayersFromFrame = register({
  name: "removeAllLayersFromFrame",
  trackEvent: { category: "history" },
  perform: (layers, editorState) => {
    const selectedFrame = getSelectedLayers(
      getNonDeletedLayers(layers),
      editorState
    )[0];

    if (selectedFrame && selectedFrame.type === "frame") {
      return {
        layers: removeAllLayersFromFrame(layers, selectedFrame, editorState),
        editorState: {
          ...editorState,
          selectedLayerIds: {
            [selectedFrame.id]: true
          }
        },
        commitToHistory: true
      };
    }

    return {
      layers,
      editorState,
      commitToHistory: false
    };
  },
  contextItemLabel: "labels.removeAllLayersFromFrame",
  predicate: (layers, editorState) => isSingleFrameSelected(layers, editorState)
});

export const actionupdateFrameRendering = register({
  name: "updateFrameRendering",
  viewMode: true,
  trackEvent: { category: "canvas" },
  perform: (layers, editorState) => ({
    layers,
    editorState: {
      ...editorState,
      frameRendering: {
        ...editorState.frameRendering,
        enabled: !editorState.frameRendering.enabled
      }
    },
    commitToHistory: false
  }),
  contextItemLabel: "labels.updateFrameRendering",
  checked: (editorState: AppState) => editorState.frameRendering.enabled
});

export const actionSetFrameAsActiveTool = register({
  name: "setFrameAsActiveTool",
  trackEvent: { category: "toolbar" },
  perform: (layers, editorState, _, app) => {
    const nextActiveTool = updateActiveTool(editorState, {
      type: "frame"
    });

    setCursorForShape(app.canvas, {
      ...editorState,
      activeTool: nextActiveTool
    });

    return {
      layers,
      editorState: {
        ...editorState,
        activeTool: updateActiveTool(editorState, {
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
