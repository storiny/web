import { getSelectedLayers } from "../lib/scene";
import { makeNextSelectedLayerIds } from "../lib/scene/selection/selection";
import { getBoundTextLayer } from "./layer/textLayer";
import { ExcalidrawLayer, GroupId, NonDeleted } from "./layer/types";
import { AppState } from "./types";

export const selectGroup = (
  groupId: GroupId,
  appState: AppState,
  layers: readonly NonDeleted<ExcalidrawLayer>[]
): AppState => {
  const layersInGroup = layers.filter((layer) =>
    layer.groupIds.includes(groupId)
  );

  if (layersInGroup.length < 2) {
    if (
      appState.selectedGroupIds[groupId] ||
      appState.editingGroupId === groupId
    ) {
      return {
        ...appState,
        selectedGroupIds: { ...appState.selectedGroupIds, [groupId]: false },
        editingGroupId: null
      };
    }
    return appState;
  }

  return {
    ...appState,
    selectedGroupIds: { ...appState.selectedGroupIds, [groupId]: true },
    selectedLayerIds: {
      ...appState.selectedLayerIds,
      ...Object.fromEntries(layersInGroup.map((layer) => [layer.id, true]))
    }
  };
};

/**
 * If the layer's group is selected, don't render an individual
 * selection border around it.
 */
export const isSelectedViaGroup = (
  appState: AppState,
  layer: ExcalidrawLayer
) => getSelectedGroupForLayer(appState, layer) != null;

export const getSelectedGroupForLayer = (
  appState: AppState,
  layer: ExcalidrawLayer
) =>
  layer.groupIds
    .filter((groupId) => groupId !== appState.editingGroupId)
    .find((groupId) => appState.selectedGroupIds[groupId]);

export const getSelectedGroupIds = (appState: AppState): GroupId[] =>
  Object.entries(appState.selectedGroupIds)
    .filter(([groupId, isSelected]) => isSelected)
    .map(([groupId, isSelected]) => groupId);

/**
 * When you select an layer, you often want to actually select the whole group it's in, unless
 * you're currently editing that group.
 */
export const selectGroupsForSelectedLayers = (
  appState: AppState,
  layers: readonly NonDeleted<ExcalidrawLayer>[],
  prevAppState: AppState
): AppState => {
  let nextAppState: AppState = { ...appState, selectedGroupIds: {} };

  const selectedLayers = getSelectedLayers(layers, appState);

  if (!selectedLayers.length) {
    return {
      ...nextAppState,
      editingGroupId: null,
      selectedLayerIds: makeNextSelectedLayerIds(
        nextAppState.selectedLayerIds,
        prevAppState
      )
    };
  }

  for (const selectedLayer of selectedLayers) {
    let groupIds = selectedLayer.groupIds;
    if (appState.editingGroupId) {
      // handle the case where a group is nested within a group
      const indexOfEditingGroup = groupIds.indexOf(appState.editingGroupId);
      if (indexOfEditingGroup > -1) {
        groupIds = groupIds.slice(0, indexOfEditingGroup);
      }
    }
    if (groupIds.length > 0) {
      const groupId = groupIds[groupIds.length - 1];
      nextAppState = selectGroup(groupId, nextAppState, layers);
    }
  }

  nextAppState.selectedLayerIds = makeNextSelectedLayerIds(
    nextAppState.selectedLayerIds,
    prevAppState
  );

  return nextAppState;
};

// given a list of layers, return the the actual group ids that should be selected
// or used to update the layers
export const selectGroupsFromGivenLayers = (
  layers: readonly NonDeleted<ExcalidrawLayer>[],
  appState: AppState
) => {
  let nextAppState: AppState = { ...appState, selectedGroupIds: {} };

  for (const layer of layers) {
    let groupIds = layer.groupIds;
    if (appState.editingGroupId) {
      const indexOfEditingGroup = groupIds.indexOf(appState.editingGroupId);
      if (indexOfEditingGroup > -1) {
        groupIds = groupIds.slice(0, indexOfEditingGroup);
      }
    }
    if (groupIds.length > 0) {
      const groupId = groupIds[groupIds.length - 1];
      nextAppState = selectGroup(groupId, nextAppState, layers);
    }
  }

  return nextAppState.selectedGroupIds;
};

export const editGroupForSelectedLayer = (
  appState: AppState,
  layer: NonDeleted<ExcalidrawLayer>
): AppState => ({
  ...appState,
  editingGroupId: layer.groupIds.length ? layer.groupIds[0] : null,
  selectedGroupIds: {},
  selectedLayerIds: {
    [layer.id]: true
  }
});

export const isLayerInGroup = (layer: ExcalidrawLayer, groupId: string) =>
  layer.groupIds.includes(groupId);

export const getLayersInGroup = (
  layers: readonly ExcalidrawLayer[],
  groupId: string
) => layers.filter((layer) => isLayerInGroup(layer, groupId));

export const getSelectedGroupIdForLayer = (
  layer: ExcalidrawLayer,
  selectedGroupIds: { [groupId: string]: boolean }
) => layer.groupIds.find((groupId) => selectedGroupIds[groupId]);

export const getNewGroupIdsForDuplication = (
  groupIds: ExcalidrawLayer["groupIds"],
  editingGroupId: AppState["editingGroupId"],
  mapper: (groupId: GroupId) => GroupId
) => {
  const copy = [...groupIds];
  const positionOfEditingGroupId = editingGroupId
    ? groupIds.indexOf(editingGroupId)
    : -1;
  const endIndex =
    positionOfEditingGroupId > -1 ? positionOfEditingGroupId : groupIds.length;
  for (let index = 0; index < endIndex; index++) {
    copy[index] = mapper(copy[index]);
  }

  return copy;
};

export const addToGroup = (
  prevGroupIds: ExcalidrawLayer["groupIds"],
  newGroupId: GroupId,
  editingGroupId: AppState["editingGroupId"]
) => {
  // insert before the editingGroupId, or push to the end.
  const groupIds = [...prevGroupIds];
  const positionOfEditingGroupId = editingGroupId
    ? groupIds.indexOf(editingGroupId)
    : -1;
  const positionToInsert =
    positionOfEditingGroupId > -1 ? positionOfEditingGroupId : groupIds.length;
  groupIds.splice(positionToInsert, 0, newGroupId);
  return groupIds;
};

export const removeFromSelectedGroups = (
  groupIds: ExcalidrawLayer["groupIds"],
  selectedGroupIds: { [groupId: string]: boolean }
) => groupIds.filter((groupId) => !selectedGroupIds[groupId]);

export const getMaximumGroups = (
  layers: ExcalidrawLayer[]
): ExcalidrawLayer[][] => {
  const groups: Map<String, ExcalidrawLayer[]> = new Map<
    String,
    ExcalidrawLayer[]
  >();

  layers.forEach((layer: ExcalidrawLayer) => {
    const groupId =
      layer.groupIds.length === 0
        ? layer.id
        : layer.groupIds[layer.groupIds.length - 1];

    const currentGroupMembers = groups.get(groupId) || [];

    // Include bound text if present when grouping
    const boundTextLayer = getBoundTextLayer(layer);
    if (boundTextLayer) {
      currentGroupMembers.push(boundTextLayer);
    }
    groups.set(groupId, [...currentGroupMembers, layer]);
  });

  return Array.from(groups.values());
};

export const layersAreInSameGroup = (layers: ExcalidrawLayer[]) => {
  const allGroups = layers.flatMap((layer) => layer.groupIds);
  const groupCount = new Map<string, number>();
  let maxGroup = 0;

  for (const group of allGroups) {
    groupCount.set(group, (groupCount.get(group) ?? 0) + 1);
    if (groupCount.get(group)! > maxGroup) {
      maxGroup = groupCount.get(group)!;
    }
  }

  return maxGroup === layers.length;
};
