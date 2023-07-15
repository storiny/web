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
  predicate: (layers, appState) => {
    const selectedLayers = getSelectedLayers(layers, appState);
    if (selectedLayers.length === 1 && isLinearLayer(selectedLayers[0])) {
      return true;
    }
    return false;
  },
  perform: (layers, appState, _, app) => {
    const selectedLayer = getSelectedLayers(
      getNonDeletedLayers(layers),
      appState,
      {
        includeBoundTextLayer: true
      }
    )[0] as ExcalidrawLinearLayer;

    const editingLinearLayer =
      appState.editingLinearLayer?.layerId === selectedLayer.id
        ? null
        : new LinearLayerEditor(selectedLayer, app.scene);
    return {
      appState: {
        ...appState,
        editingLinearLayer
      },
      commitToHistory: false
    };
  },
  contextItemLabel: (layers, appState) => {
    const selectedLayer = getSelectedLayers(
      getNonDeletedLayers(layers),
      appState,
      {
        includeBoundTextLayer: true
      }
    )[0] as ExcalidrawLinearLayer;
    return appState.editingLinearLayer?.layerId === selectedLayer.id
      ? "labels.lineEditor.exit"
      : "labels.lineEditor.edit";
  }
});
