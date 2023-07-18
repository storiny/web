import { EditorState, GroupId, Layer, NonDeleted } from "../../types";
import { getBoundTextLayer } from "../layer";
import { getSelectedLayers, makeNextSelectedLayerIds } from "../scene";

/**
 * Selects a group
 * @param groupId ID of the group to select
 * @param editorState Editor state
 * @param layers Layers
 */
export const selectGroup = (
  groupId: GroupId,
  editorState: EditorState,
  layers: readonly NonDeleted<Layer>[]
): EditorState => {
  const layersInGroup = layers.filter((layer) =>
    layer.groupIds.includes(groupId)
  );

  if (layersInGroup.length < 2) {
    if (
      editorState.selectedGroupIds[groupId] ||
      editorState.editingGroupId === groupId
    ) {
      return {
        ...editorState,
        selectedGroupIds: { ...editorState.selectedGroupIds, [groupId]: false },
        editingGroupId: null
      };
    }

    return editorState;
  }

  return {
    ...editorState,
    selectedGroupIds: { ...editorState.selectedGroupIds, [groupId]: true },
    selectedLayerIds: {
      ...editorState.selectedLayerIds,
      ...Object.fromEntries(layersInGroup.map((layer) => [layer.id, true]))
    }
  };
};

/**
 * Predicate function for determining whether a layer if within a
 * selected group
 * @param editorState Editor state
 * @param layer Layer to check
 */
export const isSelectedViaGroup = (
  editorState: EditorState,
  layer: Layer
): boolean => getSelectedGroupForLayer(editorState, layer) != null;

/**
 * Returns the selected group for the provided layer
 * @param editorState Editor state
 * @param layer Layer
 */
export const getSelectedGroupForLayer = (
  editorState: EditorState,
  layer: Layer
): string | undefined =>
  layer.groupIds
    .filter((groupId) => groupId !== editorState.editingGroupId)
    .find((groupId) => editorState.selectedGroupIds[groupId]);

/**
 * Returns the ids of selected groups
 * @param editorState Editor state
 */
export const getSelectedGroupIds = (editorState: EditorState): GroupId[] =>
  Object.entries(editorState.selectedGroupIds)
    .filter(([, isSelected]) => isSelected)
    .map(([groupId]) => groupId);

/**
 * Selects the whole parent group when the user tries to select a layer that is inside the
 * group, unless the group is being edited
 * @param editorState Editor state
 * @param layers Layers
 * @param prevEditorState Previous editor state
 */
export const selectGroupsForSelectedLayers = (
  editorState: EditorState,
  layers: readonly NonDeleted<Layer>[],
  prevEditorState: EditorState
): EditorState => {
  let nextAppState: EditorState = { ...editorState, selectedGroupIds: {} };
  const selectedLayers = getSelectedLayers(layers, editorState);

  if (!selectedLayers.length) {
    return {
      ...nextAppState,
      editingGroupId: null,
      selectedLayerIds: makeNextSelectedLayerIds(
        nextAppState.selectedLayerIds,
        prevEditorState
      )
    };
  }

  for (const selectedLayer of selectedLayers) {
    let groupIds = selectedLayer.groupIds;

    if (editorState.editingGroupId) {
      // Handle the case where a group is nested within a group
      const indexOfEditingGroup = groupIds.indexOf(editorState.editingGroupId);

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
    prevEditorState
  );

  return nextAppState;
};

/**
 * Returns the actual group ids that should be selected for the provided layers
 * @param layers Layers
 * @param editorState Editor state
 */
export const selectGroupsFromGivenLayers = (
  layers: readonly NonDeleted<Layer>[],
  editorState: EditorState
): Record<string, boolean> => {
  let nextAppState: EditorState = { ...editorState, selectedGroupIds: {} };

  for (const layer of layers) {
    let groupIds = layer.groupIds;

    if (editorState.editingGroupId) {
      const indexOfEditingGroup = groupIds.indexOf(editorState.editingGroupId);
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

/**
 * Edits a group for the selected layer
 * @param editorState Editor state
 * @param layer Layer
 */
export const editGroupForSelectedLayer = (
  editorState: EditorState,
  layer: NonDeleted<Layer>
): EditorState => ({
  ...editorState,
  editingGroupId: layer.groupIds.length ? layer.groupIds[0] : null,
  selectedGroupIds: {},
  selectedLayerIds: {
    [layer.id]: true
  }
});

/**
 * Predicate function for determining whether the provided layer is
 * present in the group
 * @param layer Layer
 * @param groupId Group ID
 */
export const isLayerInGroup = (layer: Layer, groupId: string): boolean =>
  layer.groupIds.includes(groupId);

/**
 * Returns the layers present in the group
 * @param layers Layers
 * @param groupId Group ID
 */
export const getLayersInGroup = (
  layers: readonly Layer[],
  groupId: string
): Layer[] => layers.filter((layer) => isLayerInGroup(layer, groupId));

/**
 * Returns the selected group ID for layer
 * @param layer Layer
 * @param selectedGroupIds Selected group ids
 */
export const getSelectedGroupIdForLayer = (
  layer: Layer,
  selectedGroupIds: { [groupId: string]: boolean }
): string | undefined =>
  layer.groupIds.find((groupId) => selectedGroupIds[groupId]);

/**
 * Returns new group ids for duplication
 * @param groupIds Group ids
 * @param editingGroupId Editing group id
 * @param mapper Mapping function
 */
export const getNewGroupIdsForDuplication = (
  groupIds: Layer["groupIds"],
  editingGroupId: EditorState["editingGroupId"],
  mapper: (groupId: GroupId) => GroupId
): GroupId[] => {
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

/**
 * Adds a new group
 * @param prevGroupIds Previous group ids
 * @param newGroupId New group id
 * @param editingGroupId Editing group id
 */
export const addToGroup = (
  prevGroupIds: Layer["groupIds"],
  newGroupId: GroupId,
  editingGroupId: EditorState["editingGroupId"]
): GroupId[] => {
  // Insert before the `editingGroupId`, or push to the end
  const groupIds = [...prevGroupIds];
  const positionOfEditingGroupId = editingGroupId
    ? groupIds.indexOf(editingGroupId)
    : -1;
  const positionToInsert =
    positionOfEditingGroupId > -1 ? positionOfEditingGroupId : groupIds.length;
  groupIds.splice(positionToInsert, 0, newGroupId);

  return groupIds;
};

/**
 * Removes a group from selected groups
 * @param groupIds Group ids
 * @param selectedGroupIds Selected group ids
 */
export const removeFromSelectedGroups = (
  groupIds: Layer["groupIds"],
  selectedGroupIds: { [groupId: string]: boolean }
): GroupId[] => groupIds.filter((groupId) => !selectedGroupIds[groupId]);

/**
 * Returns the maximum groups
 * @param layers Layers
 */
export const getMaximumGroups = (layers: Layer[]): Layer[][] => {
  const groups: Map<String, Layer[]> = new Map<String, Layer[]>();

  layers.forEach((layer: Layer) => {
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

/**
 * Predicate function for determining whether all the provided
 * layers are in the same group
 * @param layers Layers
 */
export const layersAreInSameGroup = (layers: Layer[]): boolean => {
  const allGroups = layers.flatMap(({ groupIds }) => groupIds);
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
