import { getSelectedLayers, isSomeLayerSelected } from "../../lib/scene";
import { GroupIcon, UngroupIcon } from "../components/icons";
import { ToolButton } from "../components/ToolButton";
import {
  getLayersInResizingFrame,
  groupByFrames,
  removeLayersFromFrame,
  replaceAllLayersInFrame
} from "../frame";
import {
  addToGroup,
  getLayersInGroup,
  getSelectedGroupIds,
  isLayerInGroup,
  removeFromSelectedGroups,
  selectGroup,
  selectGroupsForSelectedLayers
} from "../groups";
import { t } from "../i18n";
import { KEYS } from "../keys";
import { getNonDeletedLayers } from "../layer";
import { newLayerWith } from "../layer/mutateLayer";
import { isBoundToContainer } from "../layer/typeChecks";
import {
  ExcalidrawFrameLayer,
  ExcalidrawLayer,
  ExcalidrawTextLayer
} from "../layer/types";
import { randomId } from "../random";
import { AppState } from "../types";
import { arrayToMap, getShortcutKey } from "../utils";
import { register } from "./register";

const allLayersInSameGroup = (layers: readonly ExcalidrawLayer[]) => {
  if (layers.length >= 2) {
    const groupIds = layers[0].groupIds;
    for (const groupId of groupIds) {
      if (
        layers.reduce(
          (acc, layer) => acc && isLayerInGroup(layer, groupId),
          true
        )
      ) {
        return true;
      }
    }
  }
  return false;
};

const enableActionGroup = (
  layers: readonly ExcalidrawLayer[],
  appState: AppState
) => {
  const selectedLayers = getSelectedLayers(
    getNonDeletedLayers(layers),
    appState,
    {
      includeBoundTextLayer: true
    }
  );
  return selectedLayers.length >= 2 && !allLayersInSameGroup(selectedLayers);
};

export const actionGroup = register({
  name: "group",
  trackEvent: { category: "layer" },
  perform: (layers, appState, _, app) => {
    const selectedLayers = getSelectedLayers(
      getNonDeletedLayers(layers),
      appState,
      {
        includeBoundTextLayer: true
      }
    );
    if (selectedLayers.length < 2) {
      // nothing to group
      return { appState, layers, commitToHistory: false };
    }
    // if everything is already grouped into 1 group, there is nothing to do
    const selectedGroupIds = getSelectedGroupIds(appState);
    if (selectedGroupIds.length === 1) {
      const selectedGroupId = selectedGroupIds[0];
      const layerIdsInGroup = new Set(
        getLayersInGroup(layers, selectedGroupId).map((layer) => layer.id)
      );
      const selectedLayerIds = new Set(selectedLayers.map((layer) => layer.id));
      const combinedSet = new Set([
        ...Array.from(layerIdsInGroup),
        ...Array.from(selectedLayerIds)
      ]);
      if (combinedSet.size === layerIdsInGroup.size) {
        // no incremental ids in the selected ids
        return { appState, layers, commitToHistory: false };
      }
    }

    let nextLayers = [...layers];

    // this includes the case where we are grouping layers inside a frame
    // and layers outside that frame
    const groupingLayersFromDifferentFrames =
      new Set(selectedLayers.map((layer) => layer.frameId)).size > 1;
    // when it happens, we want to remove layers that are in the frame
    // and are going to be grouped from the frame (mouthful, I know)
    if (groupingLayersFromDifferentFrames) {
      const frameLayersMap = groupByFrames(selectedLayers);

      frameLayersMap.forEach((layersInFrame, frameId) => {
        nextLayers = removeLayersFromFrame(nextLayers, layersInFrame, appState);
      });
    }

    const newGroupId = randomId();
    const selectLayerIds = arrayToMap(selectedLayers);

    nextLayers = nextLayers.map((layer) => {
      if (!selectLayerIds.get(layer.id)) {
        return layer;
      }
      return newLayerWith(layer, {
        groupIds: addToGroup(
          layer.groupIds,
          newGroupId,
          appState.editingGroupId
        )
      });
    });
    // keep the z order within the group the same, but move them
    // to the z order of the highest layer in the layer stack
    const layersInGroup = getLayersInGroup(nextLayers, newGroupId);
    const lastLayerInGroup = layersInGroup[layersInGroup.length - 1];
    const lastGroupLayerIndex = nextLayers.lastIndexOf(lastLayerInGroup);
    const layersAfterGroup = nextLayers.slice(lastGroupLayerIndex + 1);
    const layersBeforeGroup = nextLayers
      .slice(0, lastGroupLayerIndex)
      .filter((updatedLayer) => !isLayerInGroup(updatedLayer, newGroupId));
    nextLayers = [...layersBeforeGroup, ...layersInGroup, ...layersAfterGroup];

    return {
      appState: selectGroup(
        newGroupId,
        { ...appState, selectedGroupIds: {} },
        getNonDeletedLayers(nextLayers)
      ),
      layers: nextLayers,
      commitToHistory: true
    };
  },
  contextItemLabel: "labels.group",
  predicate: (layers, appState) => enableActionGroup(layers, appState),
  keyTest: (event) =>
    !event.shiftKey && event[KEYS.CTRL_OR_CMD] && event.key === KEYS.G,
  PanelComponent: ({ layers, appState, updateData }) => (
    <ToolButton
      aria-label={t("labels.group")}
      hidden={!enableActionGroup(layers, appState)}
      icon={<GroupIcon theme={appState.theme} />}
      onClick={() => updateData(null)}
      title={`${t("labels.group")} — ${getShortcutKey("CtrlOrCmd+G")}`}
      type="button"
      visible={isSomeLayerSelected(getNonDeletedLayers(layers), appState)}
    ></ToolButton>
  )
});

export const actionUngroup = register({
  name: "ungroup",
  trackEvent: { category: "layer" },
  perform: (layers, appState, _, app) => {
    const groupIds = getSelectedGroupIds(appState);
    if (groupIds.length === 0) {
      return { appState, layers, commitToHistory: false };
    }

    let nextLayers = [...layers];

    const selectedLayers = getSelectedLayers(nextLayers, appState);
    const frames = selectedLayers
      .filter((layer) => layer.frameId)
      .map((layer) =>
        app.scene.getLayer(layer.frameId!)
      ) as ExcalidrawFrameLayer[];

    const boundTextLayerIds: ExcalidrawTextLayer["id"][] = [];
    nextLayers = nextLayers.map((layer) => {
      if (isBoundToContainer(layer)) {
        boundTextLayerIds.push(layer.id);
      }
      const nextGroupIds = removeFromSelectedGroups(
        layer.groupIds,
        appState.selectedGroupIds
      );
      if (nextGroupIds.length === layer.groupIds.length) {
        return layer;
      }
      return newLayerWith(layer, {
        groupIds: nextGroupIds
      });
    });

    const updateAppState = selectGroupsForSelectedLayers(
      { ...appState, selectedGroupIds: {} },
      getNonDeletedLayers(nextLayers),
      appState
    );

    frames.forEach((frame) => {
      if (frame) {
        nextLayers = replaceAllLayersInFrame(
          nextLayers,
          getLayersInResizingFrame(nextLayers, frame, appState),
          frame,
          appState
        );
      }
    });

    // remove binded text layers from selection
    updateAppState.selectedLayerIds = Object.entries(
      updateAppState.selectedLayerIds
    ).reduce((acc: { [key: ExcalidrawLayer["id"]]: true }, [id, selected]) => {
      if (selected && !boundTextLayerIds.includes(id)) {
        acc[id] = true;
      }
      return acc;
    }, {});

    return {
      appState: updateAppState,
      layers: nextLayers,
      commitToHistory: true
    };
  },
  keyTest: (event) =>
    event.shiftKey &&
    event[KEYS.CTRL_OR_CMD] &&
    event.key === KEYS.G.toUpperCase(),
  contextItemLabel: "labels.ungroup",
  predicate: (layers, appState) => getSelectedGroupIds(appState).length > 0,

  PanelComponent: ({ layers, appState, updateData }) => (
    <ToolButton
      aria-label={t("labels.ungroup")}
      hidden={getSelectedGroupIds(appState).length === 0}
      icon={<UngroupIcon theme={appState.theme} />}
      onClick={() => updateData(null)}
      title={`${t("labels.ungroup")} — ${getShortcutKey("CtrlOrCmd+Shift+G")}`}
      type="button"
      visible={isSomeLayerSelected(getNonDeletedLayers(layers), appState)}
    ></ToolButton>
  )
});
