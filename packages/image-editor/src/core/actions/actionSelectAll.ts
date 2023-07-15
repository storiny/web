import { excludeLayersInFramesFromSelection } from "../../lib/scene/selection";
import { selectGroupsForSelectedLayers } from "../groups";
import { KEYS } from "../keys";
import { getNonDeletedLayers, isTextLayer } from "../layer";
import { LinearLayerEditor } from "../layer/linearLayerEditor";
import { isLinearLayer } from "../layer/typeChecks";
import { ExcalidrawLayer } from "../layer/types";
import { register } from "./register";

export const actionSelectAll = register({
  name: "selectAll",
  trackEvent: { category: "canvas" },
  perform: (layers, appState, value, app) => {
    if (appState.editingLinearLayer) {
      return false;
    }

    const selectedLayerIds = excludeLayersInFramesFromSelection(
      layers.filter(
        (layer) =>
          !layer.isDeleted &&
          !(isTextLayer(layer) && layer.containerId) &&
          !layer.locked
      )
    ).reduce((map: Record<ExcalidrawLayer["id"], true>, layer) => {
      map[layer.id] = true;
      return map;
    }, {});

    return {
      appState: selectGroupsForSelectedLayers(
        {
          ...appState,
          selectedLinearLayer:
            // single linear layer selected
            Object.keys(selectedLayerIds).length === 1 &&
            isLinearLayer(layers[0])
              ? new LinearLayerEditor(layers[0], app.scene)
              : null,
          editingGroupId: null,
          selectedLayerIds
        },
        getNonDeletedLayers(layers),
        appState
      ),
      commitToHistory: true
    };
  },
  contextItemLabel: "labels.selectAll",
  keyTest: (event) => event[KEYS.CTRL_OR_CMD] && event.key === KEYS.A
});
