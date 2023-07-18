import { getSelectedLayers, isSomeLayerSelected } from "../../lib/scene";
import { updateActiveTool } from "../../lib/utils/utils";
import { TrashIcon } from "../components/icons";
import { ToolButton } from "../components/ToolButton";
import { getLayersInGroup } from "../groups";
import { t } from "../i18n";
import { KEYS } from "../keys";
import { getNonDeletedLayers } from "../layer";
import { fixBindingsAfterDeletion } from "../layer/binding";
import { LinearLayerEditor } from "../layer/linearLayerEditor";
import { newLayerWith } from "../layer/mutateLayer";
import { isBoundToContainer } from "../layer/typeChecks";
import { ExcalidrawLayer } from "../layer/types";
import { AppState } from "../types";
import { register } from "./register";

const deleteSelectedLayers = (
  layers: readonly ExcalidrawLayer[],
  editorState: AppState
) => {
  const framesToBeDeleted = new Set(
    getSelectedLayers(
      layers.filter((el) => el.type === "frame"),
      editorState
    ).map((el) => el.id)
  );

  return {
    layers: layers.map((el) => {
      if (editorState.selectedLayerIds[el.id]) {
        return newLayerWith(el, { isDeleted: true });
      }

      if (el.frameId && framesToBeDeleted.has(el.frameId)) {
        return newLayerWith(el, { isDeleted: true });
      }

      if (
        isBoundToContainer(el) &&
        editorState.selectedLayerIds[el.containerId]
      ) {
        return newLayerWith(el, { isDeleted: true });
      }
      return el;
    }),
    editorState: {
      ...editorState,
      selectedLayerIds: {}
    }
  };
};

const handleGroupEditingState = (
  editorState: AppState,
  layers: readonly ExcalidrawLayer[]
): AppState => {
  if (editorState.editingGroupId) {
    const siblingLayers = getLayersInGroup(
      getNonDeletedLayers(layers),
      editorState.editingGroupId!
    );
    if (siblingLayers.length) {
      return {
        ...editorState,
        selectedLayerIds: { [siblingLayers[0].id]: true }
      };
    }
  }
  return editorState;
};

export const actionDeleteSelected = register({
  name: "deleteSelectedLayers",
  trackEvent: { category: "layer", action: "delete" },
  perform: (layers, editorState) => {
    if (editorState.editingLinearLayer) {
      const {
        layerId,
        selectedPointsIndices,
        startBindingLayer,
        endBindingLayer
      } = editorState.editingLinearLayer;
      const layer = LinearLayerEditor.getLayer(layerId);
      if (!layer) {
        return false;
      }
      // case: no point selected → do nothing, as deleting the whole layer
      // is most likely a mistake, where you wanted to delete a specific point
      // but failed to select it (or you thought it's selected, while it was
      // only in a hover state)
      if (selectedPointsIndices == null) {
        return false;
      }

      // case: deleting last remaining point
      if (layer.points.length < 2) {
        const nextLayers = layers.map((el) => {
          if (el.id === layer.id) {
            return newLayerWith(el, { isDeleted: true });
          }
          return el;
        });
        const nextAppState = handleGroupEditingState(editorState, nextLayers);

        return {
          layers: nextLayers,
          editorState: {
            ...nextAppState,
            editingLinearLayer: null
          },
          commitToHistory: false
        };
      }

      // We cannot do this inside `movePoint` because it is also called
      // when deleting the uncommitted point (which hasn't caused any binding)
      const binding = {
        startBindingLayer: selectedPointsIndices?.includes(0)
          ? null
          : startBindingLayer,
        endBindingLayer: selectedPointsIndices?.includes(
          layer.points.length - 1
        )
          ? null
          : endBindingLayer
      };

      LinearLayerEditor.deletePoints(layer, selectedPointsIndices);

      return {
        layers,
        editorState: {
          ...editorState,
          editingLinearLayer: {
            ...editorState.editingLinearLayer,
            ...binding,
            selectedPointsIndices:
              selectedPointsIndices?.[0] > 0
                ? [selectedPointsIndices[0] - 1]
                : [0]
          }
        },
        commitToHistory: true
      };
    }
    let { layers: nextLayers, editorState: nextAppState } =
      deleteSelectedLayers(layers, editorState);
    fixBindingsAfterDeletion(
      nextLayers,
      layers.filter(({ id }) => editorState.selectedLayerIds[id])
    );

    nextAppState = handleGroupEditingState(nextAppState, nextLayers);

    return {
      layers: nextLayers,
      editorState: {
        ...nextAppState,
        activeTool: updateActiveTool(editorState, { type: "selection" }),
        multiLayer: null
      },
      commitToHistory: isSomeLayerSelected(
        getNonDeletedLayers(layers),
        editorState
      )
    };
  },
  contextItemLabel: "labels.delete",
  keyTest: (event, editorState, layers) =>
    (event.key === KEYS.BACKSPACE || event.key === KEYS.DELETE) &&
    !event[KEYS.CTRL_OR_CMD],
  PanelComponent: ({ layers, editorState, updateData }) => (
    <ToolButton
      aria-label={t("labels.delete")}
      icon={TrashIcon}
      onClick={() => updateData(null)}
      title={t("labels.delete")}
      type="button"
      visible={isSomeLayerSelected(getNonDeletedLayers(layers), editorState)}
    />
  )
});
