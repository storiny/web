import { isPointWithinBounds } from "../lib/math/math";
import { getLayersWithinSelection, getSelectedLayers } from "../lib/scene";
import Scene, {
  ExcalidrawLayersIncludingDeleted
} from "../lib/scene/scene/Scene";
import { arrayToMap, findIndex } from "../lib/utils/utils";
import { moveOneRight } from "../lib/zIndex/zindex";
import { getLayersInGroup, selectGroupsFromGivenLayers } from "./groups";
import { getCommonBounds, getLayerAbsoluteCoords, isTextLayer } from "./layer";
import { isFrameLayer } from "./layer";
import { getLayerLineSegments } from "./layer/bounds";
import { mutateLayer } from "./layer/mutateLayer";
import { getBoundTextLayer, getContainerLayer } from "./layer/textLayer";
import {
  ExcalidrawFrameLayer,
  ExcalidrawLayer,
  NonDeleted,
  NonDeletedExcalidrawLayer
} from "./layer/types";
import { AppState } from "./types";

// --------------------------- Frame State ------------------------------------
export const bindLayersToFramesAfterDuplication = (
  nextLayers: ExcalidrawLayer[],
  oldLayers: readonly ExcalidrawLayer[],
  oldIdToDuplicatedId: Map<ExcalidrawLayer["id"], ExcalidrawLayer["id"]>
) => {
  const nextLayerMap = arrayToMap(nextLayers) as Map<
    ExcalidrawLayer["id"],
    ExcalidrawLayer
  >;

  for (const layer of oldLayers) {
    if (layer.frameId) {
      // use its frameId to get the new frameId
      const nextLayerId = oldIdToDuplicatedId.get(layer.id);
      const nextFrameId = oldIdToDuplicatedId.get(layer.frameId);
      if (nextLayerId) {
        const nextLayer = nextLayerMap.get(nextLayerId);
        if (nextLayer) {
          mutateLayer(
            nextLayer,
            {
              frameId: nextFrameId ?? layer.frameId
            },
            false
          );
        }
      }
    }
  }
};

// --------------------------- Frame Geometry ---------------------------------
class Point {
  x: number;
  y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
}

class LineSegment {
  first: Point;
  second: Point;

  constructor(pointA: Point, pointB: Point) {
    this.first = pointA;
    this.second = pointB;
  }

  public getBoundingBox(): [Point, Point] {
    return [
      new Point(
        Math.min(this.first.x, this.second.x),
        Math.min(this.first.y, this.second.y)
      ),
      new Point(
        Math.max(this.first.x, this.second.x),
        Math.max(this.first.y, this.second.y)
      )
    ];
  }
}

// https://martin-thoma.com/how-to-check-if-two-line-segments-intersect/
class FrameGeometry {
  private static EPSILON = 0.000001;

  private static crossProduct(a: Point, b: Point) {
    return a.x * b.y - b.x * a.y;
  }

  private static doBoundingBoxesIntersect(
    a: [Point, Point],
    b: [Point, Point]
  ) {
    return (
      a[0].x <= b[1].x &&
      a[1].x >= b[0].x &&
      a[0].y <= b[1].y &&
      a[1].y >= b[0].y
    );
  }

  private static isPointOnLine(a: LineSegment, b: Point) {
    const aTmp = new LineSegment(
      new Point(0, 0),
      new Point(a.second.x - a.first.x, a.second.y - a.first.y)
    );
    const bTmp = new Point(b.x - a.first.x, b.y - a.first.y);
    const r = this.crossProduct(aTmp.second, bTmp);
    return Math.abs(r) < this.EPSILON;
  }

  private static isPointRightOfLine(a: LineSegment, b: Point) {
    const aTmp = new LineSegment(
      new Point(0, 0),
      new Point(a.second.x - a.first.x, a.second.y - a.first.y)
    );
    const bTmp = new Point(b.x - a.first.x, b.y - a.first.y);
    return this.crossProduct(aTmp.second, bTmp) < 0;
  }

  private static lineSegmentTouchesOrCrossesLine(
    a: LineSegment,
    b: LineSegment
  ) {
    return (
      this.isPointOnLine(a, b.first) ||
      this.isPointOnLine(a, b.second) ||
      (this.isPointRightOfLine(a, b.first)
        ? !this.isPointRightOfLine(a, b.second)
        : this.isPointRightOfLine(a, b.second))
    );
  }

  private static doLineSegmentsIntersect(
    a: [readonly [number, number], readonly [number, number]],
    b: [readonly [number, number], readonly [number, number]]
  ) {
    const aSegment = new LineSegment(
      new Point(a[0][0], a[0][1]),
      new Point(a[1][0], a[1][1])
    );
    const bSegment = new LineSegment(
      new Point(b[0][0], b[0][1]),
      new Point(b[1][0], b[1][1])
    );

    const box1 = aSegment.getBoundingBox();
    const box2 = bSegment.getBoundingBox();
    return (
      this.doBoundingBoxesIntersect(box1, box2) &&
      this.lineSegmentTouchesOrCrossesLine(aSegment, bSegment) &&
      this.lineSegmentTouchesOrCrossesLine(bSegment, aSegment)
    );
  }

  public static isLayerIntersectingFrame(
    layer: ExcalidrawLayer,
    frame: ExcalidrawFrameLayer
  ) {
    const frameLineSegments = getLayerLineSegments(frame);

    const layerLineSegments = getLayerLineSegments(layer);

    const intersecting = frameLineSegments.some((frameLineSegment) =>
      layerLineSegments.some((layerLineSegment) =>
        this.doLineSegmentsIntersect(frameLineSegment, layerLineSegment)
      )
    );

    return intersecting;
  }
}

export const getLayersCompletelyInFrame = (
  layers: readonly ExcalidrawLayer[],
  frame: ExcalidrawFrameLayer
) =>
  omitGroupsContainingFrames(
    getLayersWithinSelection(layers, frame, false)
  ).filter(
    (layer) =>
      (layer.type !== "frame" && !layer.frameId) || layer.frameId === frame.id
  );

export const isLayerContainingFrame = (
  layers: readonly ExcalidrawLayer[],
  layer: ExcalidrawLayer,
  frame: ExcalidrawFrameLayer
) => getLayersWithinSelection(layers, layer).some((e) => e.id === frame.id);

export const getLayersIntersectingFrame = (
  layers: readonly ExcalidrawLayer[],
  frame: ExcalidrawFrameLayer
) =>
  layers.filter((layer) =>
    FrameGeometry.isLayerIntersectingFrame(layer, frame)
  );

export const layersAreInFrameBounds = (
  layers: readonly ExcalidrawLayer[],
  frame: ExcalidrawFrameLayer
) => {
  const [selectionX1, selectionY1, selectionX2, selectionY2] =
    getLayerAbsoluteCoords(frame);

  const [layerX1, layerY1, layerX2, layerY2] = getCommonBounds(layers);

  return (
    selectionX1 <= layerX1 &&
    selectionY1 <= layerY1 &&
    selectionX2 >= layerX2 &&
    selectionY2 >= layerY2
  );
};

export const layerOverlapsWithFrame = (
  layer: ExcalidrawLayer,
  frame: ExcalidrawFrameLayer
) =>
  layersAreInFrameBounds([layer], frame) ||
  FrameGeometry.isLayerIntersectingFrame(layer, frame) ||
  isLayerContainingFrame([frame], layer, frame);

export const isCursorInFrame = (
  cursorCoords: {
    x: number;
    y: number;
  },
  frame: NonDeleted<ExcalidrawFrameLayer>
) => {
  const [fx1, fy1, fx2, fy2] = getLayerAbsoluteCoords(frame);

  return isPointWithinBounds(
    [fx1, fy1],
    [cursorCoords.x, cursorCoords.y],
    [fx2, fy2]
  );
};

export const groupsAreAtLeastIntersectingTheFrame = (
  layers: readonly NonDeletedExcalidrawLayer[],
  groupIds: readonly string[],
  frame: ExcalidrawFrameLayer
) => {
  const layersInGroup = groupIds.flatMap((groupId) =>
    getLayersInGroup(layers, groupId)
  );

  if (layersInGroup.length === 0) {
    return true;
  }

  return !!layersInGroup.find(
    (layer) =>
      layersAreInFrameBounds([layer], frame) ||
      FrameGeometry.isLayerIntersectingFrame(layer, frame)
  );
};

export const groupsAreCompletelyOutOfFrame = (
  layers: readonly NonDeletedExcalidrawLayer[],
  groupIds: readonly string[],
  frame: ExcalidrawFrameLayer
) => {
  const layersInGroup = groupIds.flatMap((groupId) =>
    getLayersInGroup(layers, groupId)
  );

  if (layersInGroup.length === 0) {
    return true;
  }

  return (
    layersInGroup.find(
      (layer) =>
        layersAreInFrameBounds([layer], frame) ||
        FrameGeometry.isLayerIntersectingFrame(layer, frame)
    ) === undefined
  );
};

// --------------------------- Frame Utils ------------------------------------

/**
 * Returns a map of frameId to frame layers. Includes empty frames.
 */
export const groupByFrames = (layers: readonly ExcalidrawLayer[]) => {
  const frameLayersMap = new Map<ExcalidrawLayer["id"], ExcalidrawLayer[]>();

  for (const layer of layers) {
    const frameId = isFrameLayer(layer) ? layer.id : layer.frameId;
    if (frameId && !frameLayersMap.has(frameId)) {
      frameLayersMap.set(frameId, getFrameLayers(layers, frameId));
    }
  }

  return frameLayersMap;
};

export const getFrameLayers = (
  allLayers: ExcalidrawLayersIncludingDeleted,
  frameId: string
) => allLayers.filter((layer) => layer.frameId === frameId);

export const getLayersInResizingFrame = (
  allLayers: ExcalidrawLayersIncludingDeleted,
  frame: ExcalidrawFrameLayer,
  editorState: AppState
): ExcalidrawLayer[] => {
  const prevLayersInFrame = getFrameLayers(allLayers, frame.id);
  const nextLayersInFrame = new Set<ExcalidrawLayer>(prevLayersInFrame);

  const layersCompletelyInFrame = new Set([
    ...getLayersCompletelyInFrame(allLayers, frame),
    ...prevLayersInFrame.filter((layer) =>
      isLayerContainingFrame(allLayers, layer, frame)
    )
  ]);

  const layersNotCompletelyInFrame = prevLayersInFrame.filter(
    (layer) => !layersCompletelyInFrame.has(layer)
  );

  // for layers that are completely in the frame
  // if they are part of some groups, then those groups are still
  // considered to belong to the frame
  const groupsToKeep = new Set<string>(
    Array.from(layersCompletelyInFrame).flatMap((layer) => layer.groupIds)
  );

  for (const layer of layersNotCompletelyInFrame) {
    if (!FrameGeometry.isLayerIntersectingFrame(layer, frame)) {
      if (layer.groupIds.length === 0) {
        nextLayersInFrame.delete(layer);
      }
    } else if (layer.groupIds.length > 0) {
      // group layer intersects with the frame, we should keep the groups
      // that this layer is part of
      for (const id of layer.groupIds) {
        groupsToKeep.add(id);
      }
    }
  }

  for (const layer of layersNotCompletelyInFrame) {
    if (layer.groupIds.length > 0) {
      let shouldRemoveLayer = true;

      for (const id of layer.groupIds) {
        if (groupsToKeep.has(id)) {
          shouldRemoveLayer = false;
        }
      }

      if (shouldRemoveLayer) {
        nextLayersInFrame.delete(layer);
      }
    }
  }

  const individualLayersCompletelyInFrame = Array.from(
    layersCompletelyInFrame
  ).filter((layer) => layer.groupIds.length === 0);

  for (const layer of individualLayersCompletelyInFrame) {
    nextLayersInFrame.add(layer);
  }

  const newGroupLayersCompletelyInFrame = Array.from(
    layersCompletelyInFrame
  ).filter((layer) => layer.groupIds.length > 0);

  const groupIds = selectGroupsFromGivenLayers(
    newGroupLayersCompletelyInFrame,
    editorState
  );

  // new group layers
  for (const [id, isSelected] of Object.entries(groupIds)) {
    if (isSelected) {
      const layersInGroup = getLayersInGroup(allLayers, id);

      if (layersAreInFrameBounds(layersInGroup, frame)) {
        for (const layer of layersInGroup) {
          nextLayersInFrame.add(layer);
        }
      }
    }
  }

  return [...nextLayersInFrame].filter(
    (layer) => !(isTextLayer(layer) && layer.containerId)
  );
};

export const getLayersInNewFrame = (
  allLayers: ExcalidrawLayersIncludingDeleted,
  frame: ExcalidrawFrameLayer
) =>
  omitGroupsContainingFrames(
    allLayers,
    getLayersCompletelyInFrame(allLayers, frame)
  );

export const getContainingFrame = (
  layer: ExcalidrawLayer,
  /**
   * Optionally an layers map, in case the layers aren't in the Scene yet.
   * Takes precedence over Scene layers, even if the layer exists
   * in Scene layers and not the supplied layers map.
   */
  layersMap?: Map<string, ExcalidrawLayer>
) => {
  if (layer.frameId) {
    if (layersMap) {
      return (layersMap.get(layer.frameId) ||
        null) as null | ExcalidrawFrameLayer;
    }
    return (
      (Scene.getScene(layer)?.getLayer(
        layer.frameId
      ) as ExcalidrawFrameLayer) || null
    );
  }
  return null;
};

// --------------------------- Frame Operations -------------------------------
export const addLayersToFrame = (
  allLayers: ExcalidrawLayersIncludingDeleted,
  layersToAdd: NonDeletedExcalidrawLayer[],
  frame: ExcalidrawFrameLayer
) => {
  const _layersToAdd: ExcalidrawLayer[] = [];

  for (const layer of layersToAdd) {
    _layersToAdd.push(layer);

    const boundTextLayer = getBoundTextLayer(layer);
    if (boundTextLayer) {
      _layersToAdd.push(boundTextLayer);
    }
  }

  let nextLayers = allLayers.slice();

  const frameBoundary = findIndex(nextLayers, (e) => e.frameId === frame.id);

  for (const layer of omitGroupsContainingFrames(allLayers, _layersToAdd)) {
    if (layer.frameId !== frame.id && !isFrameLayer(layer)) {
      mutateLayer(
        layer,
        {
          frameId: frame.id
        },
        false
      );

      const frameIndex = findIndex(nextLayers, (e) => e.id === frame.id);
      const layerIndex = findIndex(nextLayers, (e) => e.id === layer.id);

      if (layerIndex < frameBoundary) {
        nextLayers = [
          ...nextLayers.slice(0, layerIndex),
          ...nextLayers.slice(layerIndex + 1, frameBoundary),
          layer,
          ...nextLayers.slice(frameBoundary)
        ];
      } else if (layerIndex > frameIndex) {
        nextLayers = [
          ...nextLayers.slice(0, frameIndex),
          layer,
          ...nextLayers.slice(frameIndex, layerIndex),
          ...nextLayers.slice(layerIndex + 1)
        ];
      }
    }
  }

  return nextLayers;
};

export const removeLayersFromFrame = (
  allLayers: ExcalidrawLayersIncludingDeleted,
  layersToRemove: NonDeletedExcalidrawLayer[],
  editorState: AppState
) => {
  const _layersToRemove: ExcalidrawLayer[] = [];

  for (const layer of layersToRemove) {
    if (layer.frameId) {
      _layersToRemove.push(layer);
      const boundTextLayer = getBoundTextLayer(layer);
      if (boundTextLayer) {
        _layersToRemove.push(boundTextLayer);
      }
    }
  }

  for (const layer of _layersToRemove) {
    mutateLayer(
      layer,
      {
        frameId: null
      },
      false
    );
  }

  const nextLayers = moveOneRight(
    allLayers,
    editorState,
    Array.from(_layersToRemove)
  );

  return nextLayers;
};

export const removeAllLayersFromFrame = (
  allLayers: ExcalidrawLayersIncludingDeleted,
  frame: ExcalidrawFrameLayer,
  editorState: AppState
) => {
  const layersInFrame = getFrameLayers(allLayers, frame.id);
  return removeLayersFromFrame(allLayers, layersInFrame, editorState);
};

export const replaceAllLayersInFrame = (
  allLayers: ExcalidrawLayersIncludingDeleted,
  nextLayersInFrame: ExcalidrawLayer[],
  frame: ExcalidrawFrameLayer,
  editorState: AppState
) =>
  addLayersToFrame(
    removeAllLayersFromFrame(allLayers, frame, editorState),
    nextLayersInFrame,
    frame
  );

/** does not mutate layers, but return new ones */
export const updateFrameMembershipOfSelectedLayers = (
  allLayers: ExcalidrawLayersIncludingDeleted,
  editorState: AppState
) => {
  const selectedLayers = getSelectedLayers(allLayers, editorState);
  const layersToFilter = new Set<ExcalidrawLayer>(selectedLayers);

  if (editorState.editingGroupId) {
    for (const layer of selectedLayers) {
      if (layer.groupIds.length === 0) {
        layersToFilter.add(layer);
      } else {
        layer.groupIds
          .flatMap((gid) => getLayersInGroup(allLayers, gid))
          .forEach((layer) => layersToFilter.add(layer));
      }
    }
  }

  const layersToRemove = new Set<ExcalidrawLayer>();

  layersToFilter.forEach((layer) => {
    if (
      layer.frameId &&
      !isFrameLayer(layer) &&
      !isLayerInFrame(layer, allLayers, editorState)
    ) {
      layersToRemove.add(layer);
    }
  });

  return layersToRemove.size > 0
    ? removeLayersFromFrame(allLayers, [...layersToRemove], editorState)
    : allLayers;
};

/**
 * filters out layers that are inside groups that contain a frame layer
 * anywhere in the group tree
 */
export const omitGroupsContainingFrames = (
  allLayers: ExcalidrawLayersIncludingDeleted,
  /** subset of layers you want to filter. Optional perf optimization so we
   * don't have to filter all layers unnecessarily
   */
  selectedLayers?: readonly ExcalidrawLayer[]
) => {
  const uniqueGroupIds = new Set<string>();
  for (const el of selectedLayers || allLayers) {
    const topMostGroupId = el.groupIds[el.groupIds.length - 1];
    if (topMostGroupId) {
      uniqueGroupIds.add(topMostGroupId);
    }
  }

  const rejectedGroupIds = new Set<string>();
  for (const groupId of uniqueGroupIds) {
    if (getLayersInGroup(allLayers, groupId).some((el) => isFrameLayer(el))) {
      rejectedGroupIds.add(groupId);
    }
  }

  return (selectedLayers || allLayers).filter(
    (el) => !rejectedGroupIds.has(el.groupIds[el.groupIds.length - 1])
  );
};

/**
 * depending on the editorState, return target frame, which is the frame the given layer
 * is going to be added to or remove from
 */
export const getTargetFrame = (
  layer: ExcalidrawLayer,
  editorState: AppState
) => {
  const _layer = isTextLayer(layer) ? getContainerLayer(layer) || layer : layer;

  return editorState.selectedLayerIds[_layer.id] &&
    editorState.selectedLayersAreBeingDragged
    ? editorState.frameToHighlight
    : getContainingFrame(_layer);
};

// given an layer, return if the layer is in some frame
export const isLayerInFrame = (
  layer: ExcalidrawLayer,
  allLayers: ExcalidrawLayersIncludingDeleted,
  editorState: AppState
) => {
  const frame = getTargetFrame(layer, editorState);
  const _layer = isTextLayer(layer) ? getContainerLayer(layer) || layer : layer;

  if (frame) {
    if (_layer.groupIds.length === 0) {
      return layerOverlapsWithFrame(_layer, frame);
    }

    const allLayersInGroup = new Set(
      _layer.groupIds.flatMap((gid) => getLayersInGroup(allLayers, gid))
    );

    if (
      editorState.editingGroupId &&
      editorState.selectedLayersAreBeingDragged
    ) {
      const selectedLayers = new Set(getSelectedLayers(allLayers, editorState));

      const editingGroupOverlapsFrame = editorState.frameToHighlight !== null;

      if (editingGroupOverlapsFrame) {
        return true;
      }

      selectedLayers.forEach((selectedLayer) => {
        allLayersInGroup.delete(selectedLayer);
      });
    }

    for (const layerInGroup of allLayersInGroup) {
      if (isFrameLayer(layerInGroup)) {
        return false;
      }
    }

    for (const layerInGroup of allLayersInGroup) {
      if (layerOverlapsWithFrame(layerInGroup, frame)) {
        return true;
      }
    }
  }

  return false;
};
