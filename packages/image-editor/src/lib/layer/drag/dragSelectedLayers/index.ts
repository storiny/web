import { isSelectedViaGroup } from "../../../../core/groups";
import {
  EditorState,
  NonDeletedLayer,
  PointerDownState
} from "../../../../types";
import { updateBoundLayers } from "../../binding";
import { getCommonBounds } from "../../bounds";
import { mutateLayer } from "../../mutate";
import { getBoundTextLayer } from "../../text";

/**
 * Updates layer coordinates
 * @param lockDirection Whether to lock direction
 * @param distanceX Distance X
 * @param distanceY Distance Y
 * @param pointerDownState Pointer down state
 * @param layer Layer to mutate
 * @param offset Offset
 */
const updateLayerCoords = (
  lockDirection: boolean,
  distanceX: number,
  distanceY: number,
  pointerDownState: PointerDownState,
  layer: NonDeletedLayer,
  offset: { x: number; y: number }
): void => {
  let x: number;
  let y: number;

  if (lockDirection) {
    const lockX = lockDirection && distanceX < distanceY;
    const lockY = lockDirection && distanceX > distanceY;
    const original = pointerDownState.originalLayers.get(layer.id);

    x = lockX && original ? original.x : layer.x + offset.x;
    y = lockY && original ? original.y : layer.y + offset.y;
  } else {
    x = layer.x + offset.x;
    y = layer.y + offset.y;
  }

  mutateLayer(layer, {
    x,
    y
  });
};

/**
 * Drag handler for selected layers
 * @param pointerDownState Pointer down state
 * @param selectedLayers Selected layers
 * @param pointerX Pointer X coordinate
 * @param pointerY Pointer Y coordinate
 * @param lockDirection Whether to lock the direction
 * @param distanceX Distance X
 * @param distanceY Distance Y
 * @param editorState Editor state
 */
export const dragSelectedLayers = (
  pointerDownState: PointerDownState,
  selectedLayers: NonDeletedLayer[],
  pointerX: number,
  pointerY: number,
  lockDirection: boolean = false,
  distanceX: number = 0,
  distanceY: number = 0,
  editorState: EditorState
): void => {
  const [x1, y1] = getCommonBounds(selectedLayers);
  const offset = { x: pointerX - x1, y: pointerY - y1 };

  selectedLayers.forEach((layer) => {
    updateLayerCoords(
      lockDirection,
      distanceX,
      distanceY,
      pointerDownState,
      layer,
      offset
    );
    // Update coords of the bound text only if we're dragging the container directly
    // (we don't drag the group that it's part of)
    if (
      // Container isn't part of any group
      // (perf optimization, so that we don't check `isSelectedViaGroup()` in every case)
      !layer.groupIds.length ||
      // The container is part of a group, but we're dragging the container directly
      (editorState.editingGroupId && !isSelectedViaGroup(editorState, layer))
    ) {
      const textLayer = getBoundTextLayer(layer);

      if (textLayer) {
        updateLayerCoords(
          lockDirection,
          distanceX,
          distanceY,
          pointerDownState,
          textLayer,
          offset
        );
      }
    }

    updateBoundLayers(layer, {
      simultaneouslyUpdated: Array.from(selectedLayers)
    });
  });
};
