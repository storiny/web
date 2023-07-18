import Scene from "../../lib/scene/scene/Scene";
import { isSelectedViaGroup } from "../groups";
import { AppState, PointerDownState } from "../types";
import { updateBoundLayers } from "./binding";
import { getCommonBounds } from "./bounds";
import { mutateLayer } from "./mutateLayer";
import { getPerfectLayerSize } from "./sizeHelpers";
import { getBoundTextLayer } from "./textLayer";
import { isFrameLayer } from "./typeChecks";
import { NonDeletedExcalidrawLayer } from "./types";

export const dragSelectedLayers = (
  pointerDownState: PointerDownState,
  selectedLayers: NonDeletedExcalidrawLayer[],
  pointerX: number,
  pointerY: number,
  lockDirection: boolean = false,
  distanceX: number = 0,
  distanceY: number = 0,
  editorState: AppState,
  scene: Scene
) => {
  const [x1, y1] = getCommonBounds(selectedLayers);
  const offset = { x: pointerX - x1, y: pointerY - y1 };

  // we do not want a frame and its layers to be selected at the same time
  // but when it happens (due to some bug), we want to avoid updating layer
  // in the frame twice, hence the use of set
  const layersToUpdate = new Set<NonDeletedExcalidrawLayer>(selectedLayers);
  const frames = selectedLayers.filter((e) => isFrameLayer(e)).map((f) => f.id);

  if (frames.length > 0) {
    const layersInFrames = scene
      .getNonDeletedLayers()
      .filter((e) => e.frameId !== null)
      .filter((e) => frames.includes(e.frameId!));

    layersInFrames.forEach((layer) => layersToUpdate.add(layer));
  }

  layersToUpdate.forEach((layer) => {
    updateLayerCoords(
      lockDirection,
      distanceX,
      distanceY,
      pointerDownState,
      layer,
      offset
    );
    // update coords of bound text only if we're dragging the container directly
    // (we don't drag the group that it's part of)
    if (
      // container isn't part of any group
      // (perf optim so we don't check `isSelectedViaGroup()` in every case)
      !layer.groupIds.length ||
      // container is part of a group, but we're dragging the container directly
      (editorState.editingGroupId && !isSelectedViaGroup(editorState, layer))
    ) {
      const textLayer = getBoundTextLayer(layer);
      if (
        textLayer &&
        // when container is added to a frame, so will its bound text
        // so the text is already in `layersToUpdate` and we should avoid
        // updating its coords again
        (!textLayer.frameId || !frames.includes(textLayer.frameId))
      ) {
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
      simultaneouslyUpdated: Array.from(layersToUpdate)
    });
  });
};

const updateLayerCoords = (
  lockDirection: boolean,
  distanceX: number,
  distanceY: number,
  pointerDownState: PointerDownState,
  layer: NonDeletedExcalidrawLayer,
  offset: { x: number; y: number }
) => {
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
export const getDragOffsetXY = (
  selectedLayers: NonDeletedExcalidrawLayer[],
  x: number,
  y: number
): [number, number] => {
  const [x1, y1] = getCommonBounds(selectedLayers);
  return [x - x1, y - y1];
};

export const dragNewLayer = (
  draggingLayer: NonDeletedExcalidrawLayer,
  layerType: AppState["activeTool"]["type"],
  originX: number,
  originY: number,
  x: number,
  y: number,
  width: number,
  height: number,
  shouldMaintainAspectRatio: boolean,
  shouldResizeFromCenter: boolean,
  /** whether to keep given aspect ratio when `isResizeWithSidesSameLength` is
      true */
  widthAspectRatio?: number | null
) => {
  if (shouldMaintainAspectRatio && draggingLayer.type !== "selection") {
    if (widthAspectRatio) {
      height = width / widthAspectRatio;
    } else {
      // Depending on where the cursor is at (x, y) relative to where the starting point is
      // (originX, originY), we use ONLY width or height to control size increase.
      // This allows the cursor to always "stick" to one of the sides of the bounding box.
      if (Math.abs(y - originY) > Math.abs(x - originX)) {
        ({ width, height } = getPerfectLayerSize(
          layerType,
          height,
          x < originX ? -width : width
        ));
      } else {
        ({ width, height } = getPerfectLayerSize(
          layerType,
          width,
          y < originY ? -height : height
        ));
      }

      if (height < 0) {
        height = -height;
      }
    }
  }

  let newX = x < originX ? originX - width : originX;
  let newY = y < originY ? originY - height : originY;

  if (shouldResizeFromCenter) {
    width += width;
    height += height;
    newX = originX - width / 2;
    newY = originY - height / 2;
  }

  if (width !== 0 && height !== 0) {
    mutateLayer(draggingLayer, {
      x: newX,
      y: newY,
      width,
      height
    });
  }
};
