import { getSelectedLayers } from "../../lib/scene";
import { getNonDeletedLayers } from "../layer";
import { LinearLayerEditor } from "../layer/linearLayerEditor";
import { isLinearLayer } from "../layer/typeChecks";
import { ExcalidrawLinearLayer } from "../layer/types";
import { register } from "./register";

export const actionToggleLinearEditor = register({
  name: "toggleLinearEditor",
  trackEvent: {
    category: "layer"
  },
  predicate: (layers, editorState) => {
    const selectedLayers = getSelectedLayers(layers, editorState);
    if (selectedLayers.length === 1 && isLinearLayer(selectedLayers[0])) {
      return true;
    }
    return false;
  },
  perform: (layers, editorState, _, app) => {
    const selectedLayer = getSelectedLayers(
      getNonDeletedLayers(layers),
      editorState,
      {
        includeBoundTextLayer: true
      }
    )[0] as ExcalidrawLinearLayer;

    const editingLinearLayer =
      editorState.editingLinearLayer?.layerId === selectedLayer.id
        ? null
        : new LinearLayerEditor(selectedLayer, app.scene);
    return {
      editorState: {
        ...editorState,
        editingLinearLayer
      },
      commitToHistory: false
    };
  },
  contextItemLabel: (layers, editorState) => {
    const selectedLayer = getSelectedLayers(
      getNonDeletedLayers(layers),
      editorState,
      {
        includeBoundTextLayer: true
      }
    )[0] as ExcalidrawLinearLayer;
    return editorState.editingLinearLayer?.layerId === selectedLayer.id
      ? "labels.lineEditor.exit"
      : "labels.lineEditor.edit";
  }
});
