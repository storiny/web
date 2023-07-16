import { Mutable } from "@storiny/types";
import React from "react";

import { LayerType } from "../../../constants";
import { DRAGGING_THRESHOLD } from "../../../constants/new";
import {
  BindableLayer,
  EditorState,
  Layer,
  LinearLayer,
  NonDeleted,
  Point,
  PointBinding,
  PointerCoords,
  TextLayerWithContainer
} from "../../../types";
import { shouldRotateWithDiscreteAngle } from "../../keys";
import {
  arePointsEqual,
  centerPoint,
  distance2d,
  getBezierCurveLength,
  getBezierXY,
  getControlPointsForBezierCurve,
  getGridPoint,
  isPathALoop,
  mapIntervalToBezierT,
  rotate,
  rotatePoint
} from "../../math";
import { getShapeForLayer } from "../../renderer";
import { isBindingEnabled } from "../binding";
import {
  getCurvePathOps,
  getLayerPointsCoords,
  getMinMaxXYFromCurvePathOps
} from "../bounds";
import History from "../history";
import { isBindingLayer } from "../predicates";
import Scene from "../scene/Scene";
import { tupleToCoors } from "../utils";
import { getLayerAbsoluteCoords, getLockedLinearCursorAlignSize } from ".";
import { mutateLayer } from "./mutateLayer";
import { getBoundTextLayer, handleBindTextResize } from "./textLayer";

/**
 * Mid-points cache
 */
const editorMidPointsCache: {
  points: (Point | null)[];
  version: number | null;
  zoom: number | null;
} = { version: null, points: [], zoom: null };

/**
 * Normalizes selected points
 * @param points Points to normalize
 */
const normalizeSelectedPoints = (
  points: (number | null)[]
): number[] | null => {
  let nextPoints = [
    ...new Set(points.filter((p) => p !== null && p !== -1))
  ] as number[];
  nextPoints = nextPoints.sort((a, b) => a - b);
  return nextPoints.length ? nextPoints : null;
};

export class LinearLayerEditor {
  public readonly layerId: Layer["id"];
  // Indices
  public readonly selectedPointsIndices: readonly number[] | null;
  public readonly pointerDownState: {
    /** index */
    lastClickedPoint: number;
    origin: { x: number; y: number } | null;
    prevSelectedPointsIndices: readonly number[] | null;
    segmentMidpoint: {
      added: boolean;
      index: number | null;
      value: Point | null;
    };
  };

  // Whether a point is being dragged
  public readonly isDragging: boolean;
  public readonly lastUncommittedPoint: Point | null;
  public readonly pointerOffset: Readonly<{ x: number; y: number }>;
  public readonly startBindingLayer: BindableLayer | null | "keep";
  public readonly endBindingLayer: BindableLayer | null | "keep";
  public readonly hoverPointIndex: number;
  public readonly segmentMidPointHoveredCoords: Point | null;

  constructor(layer: NonDeleted<LinearLayer>, scene: Scene) {
    this.layerId = layer.id as string;
    Scene.mapLayerToScene(this.layerId, scene);
    LinearLayerEditor.normalizePoints(layer);

    this.selectedPointsIndices = null;
    this.lastUncommittedPoint = null;
    this.isDragging = false;
    this.pointerOffset = { x: 0, y: 0 };
    this.startBindingLayer = "keep";
    this.endBindingLayer = "keep";
    this.pointerDownState = {
      prevSelectedPointsIndices: null,
      lastClickedPoint: -1,
      origin: null,
      segmentMidpoint: {
        value: null,
        index: null,
        added: false
      }
    };
    this.hoverPointIndex = -1;
    this.segmentMidPointHoveredCoords = null;
  }

  // Static methods
  static POINT_HANDLE_SIZE = 10;

  /**
   * Returns layer by ID
   * @param id The `layerId` from the instance of this class (so that we can
   * statically guarantee this method returns a `LinearLayer`)
   */
  static getLayer(
    id: InstanceType<typeof LinearLayerEditor>["layerId"]
  ): NonDeleted<LinearLayer> | null {
    const layer = Scene.getScene(id)?.getNonDeletedLayer(id);

    if (layer) {
      return layer as NonDeleted<LinearLayer>;
    }

    return null;
  }

  /**
   * Handles box selection
   * @param event Pointer event
   * @param editorState Editor state
   * @param setState State dispatcher
   */
  static handleBoxSelection(
    event: PointerEvent,
    editorState: EditorState,
    setState: React.Component<any, EditorState>["setState"]
  ): false | undefined {
    if (
      !editorState.editingLinearLayer ||
      editorState.draggingLayer?.type !== LayerType.SELECTION
    ) {
      return false;
    }

    const { editingLinearLayer } = editorState;
    const { selectedPointsIndices, layerId } = editingLinearLayer;
    const layer = LinearLayerEditor.getLayer(layerId);

    if (!layer) {
      return false;
    }

    const [selectionX1, selectionY1, selectionX2, selectionY2] =
      getLayerAbsoluteCoords(editorState.draggingLayer);
    const pointsSceneCoords =
      LinearLayerEditor.getPointsGlobalCoordinates(layer);
    const nextSelectedPoints = pointsSceneCoords.reduce(
      (acc: number[], point, index) => {
        if (
          (point[0] >= selectionX1 &&
            point[0] <= selectionX2 &&
            point[1] >= selectionY1 &&
            point[1] <= selectionY2) ||
          (event.shiftKey && selectedPointsIndices?.includes(index))
        ) {
          acc.push(index);
        }

        return acc;
      },
      []
    );

    setState({
      editingLinearLayer: {
        ...editingLinearLayer,
        selectedPointsIndices: nextSelectedPoints.length
          ? nextSelectedPoints
          : null
      }
    });
  }

  /**
   * Handles point dragging
   * @param event Pointer event
   * @param editorState Editor state
   * @param scenePointerX Scene pointer X position
   * @param scenePointerY Scene pointer Y position
   * @param maybeSuggestBinding Suggest binding
   * @param linearLayerEditor Linear layer editor
   */
  static handlePointDragging(
    event: PointerEvent,
    editorState: EditorState,
    scenePointerX: number,
    scenePointerY: number,
    maybeSuggestBinding: (
      layer: NonDeleted<LinearLayer>,
      pointSceneCoords: { x: number; y: number }[]
    ) => void,
    linearLayerEditor: LinearLayerEditor
  ): boolean {
    if (!linearLayerEditor) {
      return false;
    }

    const { selectedPointsIndices, layerId } = linearLayerEditor;
    const layer = LinearLayerEditor.getLayer(layerId);

    if (!layer) {
      return false;
    }

    // Point that's being dragged (out of all selected points)
    const draggingPoint = layer.points[
      linearLayerEditor.pointerDownState.lastClickedPoint
    ] as [number, number] | undefined;

    if (selectedPointsIndices && draggingPoint) {
      if (
        shouldRotateWithDiscreteAngle(event) &&
        selectedPointsIndices.length === 1 &&
        layer.points.length > 1
      ) {
        const selectedIndex = selectedPointsIndices[0];
        const referencePoint =
          layer.points[selectedIndex === 0 ? 1 : selectedIndex - 1];

        const [width, height] = LinearLayerEditor.getShiftLockedDelta(
          layer,
          referencePoint,
          [scenePointerX, scenePointerY],
          editorState.gridSize
        );

        LinearLayerEditor.movePoints(layer, [
          {
            index: selectedIndex,
            point: [width + referencePoint[0], height + referencePoint[1]],
            isDragging:
              selectedIndex ===
              linearLayerEditor.pointerDownState.lastClickedPoint
          }
        ]);
      } else {
        const newDraggingPointPosition = LinearLayerEditor.createPointAt(
          layer,
          scenePointerX - linearLayerEditor.pointerOffset.x,
          scenePointerY - linearLayerEditor.pointerOffset.y,
          editorState.gridSize
        );
        const deltaX = newDraggingPointPosition[0] - draggingPoint[0];
        const deltaY = newDraggingPointPosition[1] - draggingPoint[1];

        LinearLayerEditor.movePoints(
          layer,
          selectedPointsIndices.map((pointIndex) => {
            const newPointPosition =
              pointIndex === linearLayerEditor.pointerDownState.lastClickedPoint
                ? LinearLayerEditor.createPointAt(
                    layer,
                    scenePointerX - linearLayerEditor.pointerOffset.x,
                    scenePointerY - linearLayerEditor.pointerOffset.y,
                    editorState.gridSize
                  )
                : ([
                    layer.points[pointIndex][0] + deltaX,
                    layer.points[pointIndex][1] + deltaY
                  ] as Point);
            return {
              index: pointIndex,
              point: newPointPosition,
              isDragging:
                pointIndex ===
                linearLayerEditor.pointerDownState.lastClickedPoint
            };
          })
        );

        const boundTextLayer = getBoundTextLayer(layer);

        if (boundTextLayer) {
          handleBindTextResize(layer, false);
        }
      }

      // Suggest bindings for first and last point if selected
      if (isBindingLayer(layer, false)) {
        const coords: { x: number; y: number }[] = [];
        const firstSelectedIndex = selectedPointsIndices[0];

        if (firstSelectedIndex === 0) {
          coords.push(
            tupleToCoors(
              LinearLayerEditor.getPointGlobalCoordinates(
                layer,
                layer.points[0]
              )
            )
          );
        }

        const lastSelectedIndex =
          selectedPointsIndices[selectedPointsIndices.length - 1];

        if (lastSelectedIndex === layer.points.length - 1) {
          coords.push(
            tupleToCoors(
              LinearLayerEditor.getPointGlobalCoordinates(
                layer,
                layer.points[lastSelectedIndex]
              )
            )
          );
        }

        if (coords.length) {
          maybeSuggestBinding(layer, coords);
        }
      }

      return true;
    }

    return false;
  }

  /**
   * Pointer up event handler
   * @param event Pointer event
   * @param editingLinearLayer Linear layer
   * @param editorState Editor state
   */
  static handlePointerUp(
    event: PointerEvent,
    editingLinearLayer: LinearLayerEditor,
    editorState: EditorState
  ): LinearLayerEditor {
    const { layerId, selectedPointsIndices, isDragging, pointerDownState } =
      editingLinearLayer;
    const layer = LinearLayerEditor.getLayer(layerId);

    if (!layer) {
      return editingLinearLayer;
    }

    const bindings: Mutable<
      Partial<
        Pick<
          InstanceType<typeof LinearLayerEditor>,
          "startBindingLayer" | "endBindingLayer"
        >
      >
    > = {};

    if (isDragging && selectedPointsIndices) {
      for (const selectedPoint of selectedPointsIndices) {
        if (selectedPoint === 0 || selectedPoint === layer.points.length - 1) {
          if (isPathALoop(layer.points, editorState.zoom.value)) {
            LinearLayerEditor.movePoints(layer, [
              {
                index: selectedPoint,
                point:
                  selectedPoint === 0
                    ? layer.points[layer.points.length - 1]
                    : layer.points[0]
              }
            ]);
          }

          bindings[
            selectedPoint === 0 ? "startBindingLayer" : "endBindingLayer"
          ] = isBindingEnabled(editorState)
            ? getHoveredLayerForBinding(
                tupleToCoors(
                  LinearLayerEditor.getPointAtIndexGlobalCoordinates(
                    layer,
                    selectedPoint!
                  )
                ),
                Scene.getScene(layer)!
              )
            : null;
        }
      }
    }

    return {
      ...editingLinearLayer,
      ...bindings,
      // If clicking without previously dragging a point(s), and not holding
      // shift, deselect all points except the one clicked. If holding shift,
      // toggle the point
      selectedPointsIndices:
        isDragging || event.shiftKey
          ? !isDragging &&
            event.shiftKey &&
            pointerDownState.prevSelectedPointsIndices?.includes(
              pointerDownState.lastClickedPoint
            )
            ? selectedPointsIndices &&
              selectedPointsIndices.filter(
                (pointIndex) => pointIndex !== pointerDownState.lastClickedPoint
              )
            : selectedPointsIndices
          : selectedPointsIndices?.includes(pointerDownState.lastClickedPoint)
          ? [pointerDownState.lastClickedPoint]
          : selectedPointsIndices,
      isDragging: false,
      pointerOffset: { x: 0, y: 0 }
    };
  }

  /**
   * Returns the editor mid-points
   * @param layer Base layer
   * @param editorState Editor state
   */
  static getEditorMidPoints = (
    layer: NonDeleted<LinearLayer>,
    editorState: EditorState
  ): (typeof editorMidPointsCache)["points"] => {
    const boundText = getBoundTextLayer(layer);

    // Since it's not needed outside the editor unless 2 pointer lines or bound text
    if (
      !editorState.editingLinearLayer &&
      layer.points.length > 2 &&
      !boundText
    ) {
      return [];
    }

    if (editorMidPointsCache.zoom === editorState.zoom.value) {
      return editorMidPointsCache.points;
    }

    LinearLayerEditor.updateEditorMidPointsCache(layer, editorState);
    return editorMidPointsCache.points!;
  };

  /**
   * Updates editor mid-points cache
   * @param layer Base layer
   * @param editorState Editor state
   */
  static updateEditorMidPointsCache = (
    layer: NonDeleted<LinearLayer>,
    editorState: EditorState
  ): void => {
    const points = LinearLayerEditor.getPointsGlobalCoordinates(layer);
    let index = 0;
    const midpoints: (Point | null)[] = [];

    while (index < points.length - 1) {
      if (
        LinearLayerEditor.isSegmentTooShort(
          layer,
          layer.points[index],
          layer.points[index + 1],
          editorState.zoom
        )
      ) {
        midpoints.push(null);
        index++;
        continue;
      }

      const segmentMidPoint = LinearLayerEditor.getSegmentMidPoint(
        layer,
        points[index],
        points[index + 1],
        index + 1
      );

      midpoints.push(segmentMidPoint);
      index++;
    }

    editorMidPointsCache.points = midpoints;
    editorMidPointsCache.zoom = editorState.zoom.value;
  };

  /**
   * Returns the segment's mid-point hit coordinates
   * @param linearLayerEditor Linear editor
   * @param scenePointer Scene pointer
   * @param editorState Editor state
   */
  static getSegmentMidpointHitCoords = (
    linearLayerEditor: LinearLayerEditor,
    scenePointer: { x: number; y: number },
    editorState: EditorState
  ): [number, number] | null => {
    const { layerId } = linearLayerEditor;
    const layer = LinearLayerEditor.getLayer(layerId);

    if (!layer) {
      return null;
    }

    const clickedPointIndex = LinearLayerEditor.getPointIndexUnderCursor(
      layer,
      editorState.zoom,
      scenePointer.x,
      scenePointer.y
    );

    if (clickedPointIndex >= 0) {
      return null;
    }

    const points = LinearLayerEditor.getPointsGlobalCoordinates(layer);

    if (points.length >= 3 && !editorState.editingLinearLayer) {
      return null;
    }

    const threshold =
      LinearLayerEditor.POINT_HANDLE_SIZE / editorState.zoom.value;
    const existingSegmentMidpointHitCoords =
      linearLayerEditor.segmentMidPointHoveredCoords;

    if (existingSegmentMidpointHitCoords) {
      const distance = distance2d(
        existingSegmentMidpointHitCoords[0],
        existingSegmentMidpointHitCoords[1],
        scenePointer.x,
        scenePointer.y
      );

      if (distance <= threshold) {
        return existingSegmentMidpointHitCoords;
      }
    }

    let index = 0;
    const midPoints: (typeof editorMidPointsCache)["points"] =
      LinearLayerEditor.getEditorMidPoints(layer, editorState);

    while (index < midPoints.length) {
      if (midPoints[index] !== null) {
        const distance = distance2d(
          midPoints[index]![0],
          midPoints[index]![1],
          scenePointer.x,
          scenePointer.y
        );
        if (distance <= threshold) {
          return midPoints[index];
        }
      }

      index++;
    }

    return null;
  };

  /**
   * Predicate function for checking whether a segment is too short
   * @param layer Linear layer
   * @param startPoint Start point for measurement
   * @param endPoint End point for measurement
   * @param zoom Zoom value
   */
  static isSegmentTooShort(
    layer: NonDeleted<LinearLayer>,
    startPoint: Point,
    endPoint: Point,
    zoom: EditorState["zoom"]
  ): boolean {
    let distance = distance2d(
      startPoint[0],
      startPoint[1],
      endPoint[0],
      endPoint[1]
    );

    if (layer.points.length > 2 && layer.roundness) {
      distance = getBezierCurveLength(layer, endPoint);
    }

    return distance * zoom.value < LinearLayerEditor.POINT_HANDLE_SIZE * 4;
  }

  /**
   * Returns the mid-point of a segment
   * @param layer Linear layer
   * @param startPoint Start point
   * @param endPoint End point
   * @param endPointIndex End point index
   */
  static getSegmentMidPoint(
    layer: NonDeleted<LinearLayer>,
    startPoint: Point,
    endPoint: Point,
    endPointIndex: number
  ): Point {
    let segmentMidPoint = centerPoint(startPoint, endPoint);

    if (layer.points.length > 2 && layer.roundness) {
      const controlPoints = getControlPointsForBezierCurve(
        layer,
        layer.points[endPointIndex]
      );

      if (controlPoints) {
        const t = mapIntervalToBezierT(layer, layer.points[endPointIndex], 0.5);
        const [tx, ty] = getBezierXY(
          controlPoints[0],
          controlPoints[1],
          controlPoints[2],
          controlPoints[3],
          t
        );

        segmentMidPoint = LinearLayerEditor.getPointGlobalCoordinates(layer, [
          tx,
          ty
        ]) as Point;
      }
    }

    return segmentMidPoint;
  }

  /**
   * Returns the mid-point index of a segment
   * @param linearLayerEditor Linear layer editor
   * @param editorState Editor state
   * @param midPoint Mid point coordinates
   */
  static getSegmentMidPointIndex(
    linearLayerEditor: LinearLayerEditor,
    editorState: EditorState,
    midPoint: Point
  ): number {
    const layer = LinearLayerEditor.getLayer(linearLayerEditor.layerId);

    if (!layer) {
      return -1;
    }

    const midPoints = LinearLayerEditor.getEditorMidPoints(layer, editorState);
    let index = 0;

    while (index < midPoints.length) {
      if (LinearLayerEditor.arePointsEqual(midPoint, midPoints[index])) {
        return index + 1;
      }
      index++;
    }

    return -1;
  }

  /**
   * Pointer down event handler
   * @param event Pointer event
   * @param editorState Editor state
   * @param history History
   * @param scenePointer Scene pointer
   * @param linearLayerEditor Linear layer editor
   */
  static handlePointerDown(
    event: React.PointerEvent<HTMLElement>,
    editorState: EditorState,
    history: History,
    scenePointer: { x: number; y: number },
    linearLayerEditor: LinearLayerEditor
  ): {
    didAddPoint: boolean;
    hitLayer: NonDeleted<Layer> | null;
    linearLayerEditor: LinearLayerEditor | null;
  } {
    const ret: ReturnType<(typeof LinearLayerEditor)["handlePointerDown"]> = {
      didAddPoint: false,
      hitLayer: null,
      linearLayerEditor: null
    };

    if (!linearLayerEditor) {
      return ret;
    }

    const { layerId } = linearLayerEditor;
    const layer = LinearLayerEditor.getLayer(layerId);

    if (!layer) {
      return ret;
    }

    const segmentMidpoint = LinearLayerEditor.getSegmentMidpointHitCoords(
      linearLayerEditor,
      scenePointer,
      editorState
    );
    let segmentMidpointIndex = null;

    if (segmentMidpoint) {
      segmentMidpointIndex = LinearLayerEditor.getSegmentMidPointIndex(
        linearLayerEditor,
        editorState,
        segmentMidpoint
      );
    }

    if (event.altKey && editorState.editingLinearLayer) {
      if (linearLayerEditor.lastUncommittedPoint == null) {
        mutateLayer(layer, {
          points: [
            ...layer.points,
            LinearLayerEditor.createPointAt(
              layer,
              scenePointer.x,
              scenePointer.y,
              editorState.gridSize
            )
          ]
        });
        ret.didAddPoint = true;
      }

      history.resumeRecording();

      ret.linearLayerEditor = {
        ...linearLayerEditor,
        pointerDownState: {
          prevSelectedPointsIndices: linearLayerEditor.selectedPointsIndices,
          lastClickedPoint: -1,
          origin: { x: scenePointer.x, y: scenePointer.y },
          segmentMidpoint: {
            value: segmentMidpoint,
            index: segmentMidpointIndex,
            added: false
          }
        },
        selectedPointsIndices: [layer.points.length - 1],
        lastUncommittedPoint: null,
        endBindingLayer: getHoveredLayerForBinding(
          scenePointer,
          Scene.getScene(layer)!
        )
      };

      ret.didAddPoint = true;
      return ret;
    }

    const clickedPointIndex = LinearLayerEditor.getPointIndexUnderCursor(
      layer,
      editorState.zoom,
      scenePointer.x,
      scenePointer.y
    );

    // If clicked on a point, set the layer as `hitLayer` otherwise
    // it would get deselected if the point is outside the hitbox area
    if (clickedPointIndex >= 0 || segmentMidpoint) {
      ret.hitLayer = layer;
    } else {
      // The binding laters are stored on `LinearLayerEditor`, instead of computing
      // them from the end points of the `linearLayer`, this is to allow disabling
      // binding (which needs to happen at the point the user finishes moving
      // the point)
      const { startBindingLayer, endBindingLayer } = linearLayerEditor;
      if (isBindingEnabled(editorState) && isBindingLayer(layer)) {
        bindOrUnbindLinearLayer(layer, startBindingLayer, endBindingLayer);
      }
    }

    const [x1, y1, x2, y2] = getLayerAbsoluteCoords(layer);
    const cx = (x1 + x2) / 2;
    const cy = (y1 + y2) / 2;
    const targetPoint =
      clickedPointIndex > -1 &&
      rotate(
        layer.x + layer.points[clickedPointIndex][0],
        layer.y + layer.points[clickedPointIndex][1],
        cx,
        cy,
        layer.angle
      );

    const nextSelectedPointsIndices =
      clickedPointIndex > -1 || event.shiftKey
        ? event.shiftKey ||
          linearLayerEditor.selectedPointsIndices?.includes(clickedPointIndex)
          ? normalizeSelectedPoints([
              ...(linearLayerEditor.selectedPointsIndices || []),
              clickedPointIndex
            ])
          : [clickedPointIndex]
        : null;

    ret.linearLayerEditor = {
      ...linearLayerEditor,
      pointerDownState: {
        prevSelectedPointsIndices: linearLayerEditor.selectedPointsIndices,
        lastClickedPoint: clickedPointIndex,
        origin: { x: scenePointer.x, y: scenePointer.y },
        segmentMidpoint: {
          value: segmentMidpoint,
          index: segmentMidpointIndex,
          added: false
        }
      },
      selectedPointsIndices: nextSelectedPointsIndices,
      pointerOffset: targetPoint
        ? {
            x: scenePointer.x - targetPoint[0],
            y: scenePointer.y - targetPoint[1]
          }
        : { x: 0, y: 0 }
    };

    return ret;
  }

  /**
   * Predicate function for checking whether two points are equal
   * @param point1 First point
   * @param point2 Second point
   */
  static arePointsEqual(point1: Point | null, point2: Point | null): boolean {
    if (!point1 && !point2) {
      return true;
    }

    if (!point1 || !point2) {
      return false;
    }

    return arePointsEqual(point1, point2);
  }

  /**
   * Pointer move event handler
   * @param event Pointer event
   * @param scenePointerX Scene pointer X position
   * @param scenePointerY Scene pointer Y position
   * @param editorState Editor state
   */
  static handlePointerMove(
    event: React.PointerEvent<HTMLCanvasElement>,
    scenePointerX: number,
    scenePointerY: number,
    editorState: EditorState
  ): LinearLayerEditor | null {
    if (!editorState.editingLinearLayer) {
      return null;
    }

    const { layerId, lastUncommittedPoint } = editorState.editingLinearLayer;
    const layer = LinearLayerEditor.getLayer(layerId);

    if (!layer) {
      return editorState.editingLinearLayer;
    }

    const { points } = layer;
    const lastPoint = points[points.length - 1];

    if (!event.altKey) {
      if (lastPoint === lastUncommittedPoint) {
        LinearLayerEditor.deletePoints(layer, [points.length - 1]);
      }

      return {
        ...editorState.editingLinearLayer,
        lastUncommittedPoint: null
      };
    }

    let newPoint: Point;

    if (shouldRotateWithDiscreteAngle(event) && points.length >= 2) {
      const lastCommittedPoint = points[points.length - 2];
      const [width, height] = LinearLayerEditor.getShiftLockedDelta(
        layer,
        lastCommittedPoint,
        [scenePointerX, scenePointerY],
        editorState.gridSize
      );

      newPoint = [
        width + lastCommittedPoint[0],
        height + lastCommittedPoint[1]
      ];
    } else {
      newPoint = LinearLayerEditor.createPointAt(
        layer,
        scenePointerX - editorState.editingLinearLayer.pointerOffset.x,
        scenePointerY - editorState.editingLinearLayer.pointerOffset.y,
        editorState.gridSize
      );
    }

    if (lastPoint === lastUncommittedPoint) {
      LinearLayerEditor.movePoints(layer, [
        {
          index: layer.points.length - 1,
          point: newPoint
        }
      ]);
    } else {
      LinearLayerEditor.addPoints(layer, editorState, [{ point: newPoint }]);
    }
    return {
      ...editorState.editingLinearLayer,
      lastUncommittedPoint: layer.points[layer.points.length - 1]
    };
  }

  /**
   * Returns the global point coordinates
   * @param layer Linear layer
   * @param point Point whose coordinates need to be computed
   */
  static getPointGlobalCoordinates(
    layer: NonDeleted<LinearLayer>,
    point: Point
  ): Readonly<Point> {
    const [x1, y1, x2, y2] = getLayerAbsoluteCoords(layer);
    const cx = (x1 + x2) / 2;
    const cy = (y1 + y2) / 2;

    let { x, y } = layer;
    [x, y] = rotate(x + point[0], y + point[1], cx, cy, layer.angle);

    return [x, y];
  }

  /**
   * Returns the global coordinates of multiple layer points
   * @param layer Linear layer
   */
  static getPointsGlobalCoordinates(layer: NonDeleted<LinearLayer>): Point[] {
    const [x1, y1, x2, y2] = getLayerAbsoluteCoords(layer);
    const cx = (x1 + x2) / 2;
    const cy = (y1 + y2) / 2;

    return layer.points.map((point) => {
      let { x, y } = layer;
      [x, y] = rotate(x + point[0], y + point[1], cx, cy, layer.angle);
      return [x, y];
    });
  }

  /**
   * Returns the point at the specified index
   * @param layer Linear layer
   * @param indexMaybeFromEnd Index (-1 for last layer)
   */
  static getPointAtIndexGlobalCoordinates(
    layer: NonDeleted<LinearLayer>,
    indexMaybeFromEnd: number
  ): Point {
    const index =
      indexMaybeFromEnd < 0
        ? layer.points.length + indexMaybeFromEnd
        : indexMaybeFromEnd;
    const [x1, y1, x2, y2] = getLayerAbsoluteCoords(layer);
    const cx = (x1 + x2) / 2;
    const cy = (y1 + y2) / 2;
    const point = layer.points[index];
    const { x, y } = layer;
    return point
      ? rotate(x + point[0], y + point[1], cx, cy, layer.angle)
      : rotate(x, y, cx, cy, layer.angle);
  }

  /**
   * Returns the point from absolute coordinates
   * @param layer Linear layer
   * @param absoluteCoords Absolute coordinates
   */
  static pointFromAbsoluteCoords(
    layer: NonDeleted<LinearLayer>,
    absoluteCoords: Point
  ): Point {
    const [x1, y1, x2, y2] = getLayerAbsoluteCoords(layer);
    const cx = (x1 + x2) / 2;
    const cy = (y1 + y2) / 2;
    const [x, y] = rotate(
      absoluteCoords[0],
      absoluteCoords[1],
      cx,
      cy,
      -layer.angle
    );

    return [x - layer.x, y - layer.y];
  }

  /**
   * Returns the point index under the cursor
   * @param layer Linear layer
   * @param zoom Canvas zoom value
   * @param x X coordinate
   * @param y Y coordinate
   */
  static getPointIndexUnderCursor(
    layer: NonDeleted<LinearLayer>,
    zoom: EditorState["zoom"],
    x: number,
    y: number
  ): number {
    const pointHandles = LinearLayerEditor.getPointsGlobalCoordinates(layer);
    let idx = pointHandles.length;
    // Loop from right to left because points on the right are rendered over
    // points on the left, thus should take precedence when clicking, if they
    // overlap
    while (--idx > -1) {
      const point = pointHandles[idx];
      if (
        distance2d(x, y, point[0], point[1]) * zoom.value <
        // +1px to account for outline stroke
        LinearLayerEditor.POINT_HANDLE_SIZE + 1
      ) {
        return idx;
      }
    }

    return -1;
  }

  /**
   * Creates a point at the specified coordinates
   * @param layer Linear layer
   * @param scenePointerX Scene pointer X coordinate
   * @param scenePointerY Scene pointer Y coordinate
   * @param gridSize Grid size value
   */
  static createPointAt(
    layer: NonDeleted<LinearLayer>,
    scenePointerX: number,
    scenePointerY: number,
    gridSize: number | null
  ): Point {
    const pointerOnGrid = getGridPoint(scenePointerX, scenePointerY, gridSize);
    const [x1, y1, x2, y2] = getLayerAbsoluteCoords(layer);
    const cx = (x1 + x2) / 2;
    const cy = (y1 + y2) / 2;
    const [rotatedX, rotatedY] = rotate(
      pointerOnGrid[0],
      pointerOnGrid[1],
      cx,
      cy,
      -layer.angle
    );

    return [rotatedX - layer.x, rotatedY - layer.y];
  }

  /**
   * Normalizes line points so that the start point is at [0,0]. Also returns new x/y to account
   * for the potential normalization
   * @param layer Linear layer
   */
  static getNormalizedPoints(layer: LinearLayer): {
    points: Point[];
    x: number;
    y: number;
  } {
    const { points } = layer;
    const offsetX = points[0][0];
    const offsetY = points[0][1];

    return {
      points: points.map((point) => [point[0] - offsetX, point[1] - offsetY]),
      x: layer.x + offsetX,
      y: layer.y + offsetY
    };
  }

  // Layer mutating methods

  /**
   * Normalizes points in the layer
   * @param layer Linear layer
   */
  static normalizePoints(layer: NonDeleted<LinearLayer>): void {
    mutateLayer(layer, LinearLayerEditor.getNormalizedPoints(layer));
  }

  /**
   * Duplicates selected points
   * @param editorState Editor state
   */
  static duplicateSelectedPoints(
    editorState: EditorState
  ): { editorState: EditorState } | false {
    if (!editorState.editingLinearLayer) {
      return false;
    }

    const { selectedPointsIndices, layerId } = editorState.editingLinearLayer;
    const layer = LinearLayerEditor.getLayer(layerId);

    if (!layer || selectedPointsIndices === null) {
      return false;
    }

    const { points } = layer;
    const nextSelectedIndices: number[] = [];
    let pointAddedToEnd = false;
    let indexCursor = -1;
    const nextPoints = points.reduce((acc: Point[], point, index) => {
      ++indexCursor;
      acc.push(point);
      const isSelected = selectedPointsIndices.includes(index);

      if (isSelected) {
        const nextPoint = points[index + 1];

        if (!nextPoint) {
          pointAddedToEnd = true;
        }

        acc.push(
          nextPoint
            ? [(point[0] + nextPoint[0]) / 2, (point[1] + nextPoint[1]) / 2]
            : [point[0], point[1]]
        );

        nextSelectedIndices.push(indexCursor + 1);
        ++indexCursor;
      }

      return acc;
    }, []);

    mutateLayer(layer, { points: nextPoints });

    // Temp hack to ensure the line doesn't move when adding point to the end,
    // potentially expanding the bounding box
    if (pointAddedToEnd) {
      const lastPoint = layer.points[layer.points.length - 1];
      LinearLayerEditor.movePoints(layer, [
        {
          index: layer.points.length - 1,
          point: [lastPoint[0] + 30, lastPoint[1] + 30]
        }
      ]);
    }

    return {
      editorState: {
        ...editorState,
        editingLinearLayer: {
          ...editorState.editingLinearLayer,
          selectedPointsIndices: nextSelectedIndices
        }
      }
    };
  }

  /**
   * Deletes the specified points
   * @param layer Linear layer
   * @param pointIndices Indices of points to delete
   */
  static deletePoints(
    layer: NonDeleted<LinearLayer>,
    pointIndices: readonly number[]
  ): void {
    let offsetX = 0;
    let offsetY = 0;
    const isDeletingOriginPoint = pointIndices.includes(0);

    // If deleting the first point, make the next to be [0,0] and recalculate
    // positions of the rest with respect to it
    if (isDeletingOriginPoint) {
      const firstNonDeletedPoint = layer.points.find(
        (point, index) => !pointIndices.includes(index)
      );

      if (firstNonDeletedPoint) {
        offsetX = firstNonDeletedPoint[0];
        offsetY = firstNonDeletedPoint[1];
      }
    }

    const nextPoints = layer.points.reduce((acc: Point[], point, idx) => {
      if (!pointIndices.includes(idx)) {
        acc.push(
          !acc.length ? [0, 0] : [point[0] - offsetX, point[1] - offsetY]
        );
      }

      return acc;
    }, []);

    LinearLayerEditor.updatePoints(layer, nextPoints, offsetX, offsetY);
  }

  /**
   * Adds new points to the layer
   * @param layer Linear layer
   * @param editorState Editor state
   * @param targetPoints Points to add
   */
  static addPoints(
    layer: NonDeleted<LinearLayer>,
    editorState: EditorState,
    targetPoints: { point: Point }[]
  ): void {
    const offsetX = 0;
    const offsetY = 0;
    const nextPoints = [
      ...layer.points,
      ...targetPoints.map(({ point }) => point)
    ];

    LinearLayerEditor.updatePoints(layer, nextPoints, offsetX, offsetY);
  }

  /**
   * Moves points
   * @param layer Linear layer
   * @param targetPoints Target points
   * @param otherUpdates Misc updates
   */
  static movePoints(
    layer: NonDeleted<LinearLayer>,
    targetPoints: { index: number; isDragging?: boolean; point: Point }[],
    otherUpdates?: { endBinding?: PointBinding; startBinding?: PointBinding }
  ): void {
    const { points } = layer;

    // In case we're moving start point, instead of modifying its position
    // which would break the invariant of it being at [0,0], we move
    // all the other points in the opposite direction by delta to
    // offset it. We do the same with actual layer x/y position, so
    // that these hacks are completely transparent to the user
    let offsetX = 0;
    let offsetY = 0;
    const selectedOriginPoint = targetPoints.find(({ index }) => index === 0);

    if (selectedOriginPoint) {
      offsetX =
        selectedOriginPoint.point[0] + points[selectedOriginPoint.index][0];
      offsetY =
        selectedOriginPoint.point[1] + points[selectedOriginPoint.index][1];
    }

    const nextPoints = points.map((point, index) => {
      const selectedPointData = targetPoints.find((p) => p.index === index);
      if (selectedPointData) {
        if (selectedOriginPoint) {
          return point;
        }

        const deltaX =
          selectedPointData.point[0] - points[selectedPointData.index][0];
        const deltaY =
          selectedPointData.point[1] - points[selectedPointData.index][1];

        return [point[0] + deltaX, point[1] + deltaY] as const;
      }

      return offsetX || offsetY
        ? ([point[0] - offsetX, point[1] - offsetY] as const)
        : point;
    });

    LinearLayerEditor.updatePoints(
      layer,
      nextPoints as Point[],
      offsetX,
      offsetY,
      otherUpdates
    );
  }

  /**
   * Predicate function for checking whether to add a midpoint
   * @param linearLayerEditor Linear layer
   * @param pointerCoords Pointer coordinates
   * @param editorState Editor state
   */
  static shouldAddMidpoint(
    linearLayerEditor: LinearLayerEditor,
    pointerCoords: PointerCoords,
    editorState: EditorState
  ): boolean {
    const layer = LinearLayerEditor.getLayer(linearLayerEditor.layerId);

    if (!layer) {
      return false;
    }

    const { segmentMidpoint } = linearLayerEditor.pointerDownState;

    if (
      segmentMidpoint.added ||
      segmentMidpoint.value === null ||
      segmentMidpoint.index === null ||
      linearLayerEditor.pointerDownState.origin === null
    ) {
      return false;
    }

    const origin = linearLayerEditor.pointerDownState.origin!;
    const dist = distance2d(
      origin.x,
      origin.y,
      pointerCoords.x,
      pointerCoords.y
    );

    return !(
      !editorState.editingLinearLayer &&
      dist < DRAGGING_THRESHOLD / editorState.zoom.value
    );
  }

  /**
   * Adds a midpoint
   * @param linearLayerEditor Linear layer editor
   * @param pointerCoords Pointer coordinates
   * @param editorState Editor state
   */
  static addMidpoint(
    linearLayerEditor: LinearLayerEditor,
    pointerCoords: PointerCoords,
    editorState: EditorState
  ):
    | {
        pointerDownState: LinearLayerEditor["pointerDownState"];
        selectedPointsIndices: LinearLayerEditor["selectedPointsIndices"];
      }
    | undefined {
    const layer = LinearLayerEditor.getLayer(linearLayerEditor.layerId);

    if (!layer) {
      return;
    }

    const { segmentMidpoint } = linearLayerEditor.pointerDownState;
    const ret: {
      pointerDownState: LinearLayerEditor["pointerDownState"];
      selectedPointsIndices: LinearLayerEditor["selectedPointsIndices"];
    } = {
      pointerDownState: linearLayerEditor.pointerDownState,
      selectedPointsIndices: linearLayerEditor.selectedPointsIndices
    };

    const midpoint = LinearLayerEditor.createPointAt(
      layer,
      pointerCoords.x,
      pointerCoords.y,
      editorState.gridSize
    );
    const points = [
      ...layer.points.slice(0, segmentMidpoint.index!),
      midpoint,
      ...layer.points.slice(segmentMidpoint.index!)
    ];

    mutateLayer(layer, {
      points
    });

    ret.pointerDownState = {
      ...linearLayerEditor.pointerDownState,
      segmentMidpoint: {
        ...linearLayerEditor.pointerDownState.segmentMidpoint,
        added: true
      },
      lastClickedPoint: segmentMidpoint.index!
    };
    ret.selectedPointsIndices = [segmentMidpoint.index!];

    return ret;
  }

  /**
   * Updates points
   * @param layer Linear layer
   * @param nextPoints New points
   * @param offsetX Offset X
   * @param offsetY Offset Y
   * @param otherUpdates Misc updates
   * @private
   */
  private static updatePoints(
    layer: NonDeleted<LinearLayer>,
    nextPoints: readonly Point[],
    offsetX: number,
    offsetY: number,
    otherUpdates?: { endBinding?: PointBinding; startBinding?: PointBinding }
  ): void {
    const nextCoords = getLayerPointsCoords(layer, nextPoints);
    const prevCoords = getLayerPointsCoords(layer, layer.points);
    const nextCenterX = (nextCoords[0] + nextCoords[2]) / 2;
    const nextCenterY = (nextCoords[1] + nextCoords[3]) / 2;
    const prevCenterX = (prevCoords[0] + prevCoords[2]) / 2;
    const prevCenterY = (prevCoords[1] + prevCoords[3]) / 2;
    const dX = prevCenterX - nextCenterX;
    const dY = prevCenterY - nextCenterY;
    const rotated = rotate(offsetX, offsetY, dX, dY, layer.angle);
    mutateLayer(layer, {
      ...otherUpdates,
      points: nextPoints,
      x: layer.x + rotated[0],
      y: layer.y + rotated[1]
    });
  }

  /**
   * Returns the shift locked delta value
   * @param layer Linear layer
   * @param referencePoint Ref point
   * @param scenePointer Scene pointer
   * @param gridSize Grid size value
   * @private
   */
  private static getShiftLockedDelta(
    layer: NonDeleted<LinearLayer>,
    referencePoint: Point,
    scenePointer: Point,
    gridSize: number | null
  ): [number, number] {
    const referencePointCoords = LinearLayerEditor.getPointGlobalCoordinates(
      layer,
      referencePoint
    );

    const [gridX, gridY] = getGridPoint(
      scenePointer[0],
      scenePointer[1],
      gridSize
    );

    const { width, height } = getLockedLinearCursorAlignSize(
      referencePointCoords[0],
      referencePointCoords[1],
      gridX,
      gridY
    );

    return rotatePoint([width, height], [0, 0], -layer.angle);
  }

  /**
   * Returns the bounded text layer position
   * @param layer Linear layer
   * @param boundTextLayer Contained text layer
   */
  static getBoundTextLayerPosition = (
    layer: LinearLayer,
    boundTextLayer: TextLayerWithContainer
  ): { x: number; y: number } => {
    const points = LinearLayerEditor.getPointsGlobalCoordinates(layer);

    if (points.length < 2) {
      mutateLayer(boundTextLayer, { isDeleted: true });
    }

    let x: number;
    let y: number;

    if (layer.points.length % 2 === 1) {
      const index = Math.floor(layer.points.length / 2);
      const midPoint = LinearLayerEditor.getPointGlobalCoordinates(
        layer,
        layer.points[index]
      );

      x = midPoint[0] - boundTextLayer.width / 2;
      y = midPoint[1] - boundTextLayer.height / 2;
    } else {
      const index = layer.points.length / 2 - 1;
      let midSegmentMidpoint = editorMidPointsCache.points[index];

      if (layer.points.length === 2) {
        midSegmentMidpoint = centerPoint(points[0], points[1]);
      }

      if (!midSegmentMidpoint) {
        midSegmentMidpoint = LinearLayerEditor.getSegmentMidPoint(
          layer,
          points[index],
          points[index + 1],
          index + 1
        );
      }

      x = midSegmentMidpoint[0] - boundTextLayer.width / 2;
      y = midSegmentMidpoint[1] - boundTextLayer.height / 2;
    }

    return { x, y };
  };

  /**
   * Returns the minimum and maximum value of XY coordinates of a text container
   * @param layer Linear layer
   * @param layerBounds Layer bounds
   * @param boundTextLayer Contained text layer
   */
  static getMinMaxXYWithBoundText = (
    layer: LinearLayer,
    layerBounds: [number, number, number, number],
    boundTextLayer: TextLayerWithContainer
  ): [number, number, number, number, number, number] => {
    let [x1, y1, x2, y2] = layerBounds;
    const cx = (x1 + x2) / 2;
    const cy = (y1 + y2) / 2;
    const { x: boundTextX1, y: boundTextY1 } =
      LinearLayerEditor.getBoundTextLayerPosition(layer, boundTextLayer);
    const boundTextX2 = boundTextX1 + boundTextLayer.width;
    const boundTextY2 = boundTextY1 + boundTextLayer.height;
    const topLeftRotatedPoint = rotatePoint([x1, y1], [cx, cy], layer.angle);
    const topRightRotatedPoint = rotatePoint([x2, y1], [cx, cy], layer.angle);
    const counterRotateBoundTextTopLeft = rotatePoint(
      [boundTextX1, boundTextY1],
      [cx, cy],
      -layer.angle
    );
    const counterRotateBoundTextTopRight = rotatePoint(
      [boundTextX2, boundTextY1],
      [cx, cy],
      -layer.angle
    );
    const counterRotateBoundTextBottomLeft = rotatePoint(
      [boundTextX1, boundTextY2],
      [cx, cy],
      -layer.angle
    );
    const counterRotateBoundTextBottomRight = rotatePoint(
      [boundTextX2, boundTextY2],
      [cx, cy],
      -layer.angle
    );

    if (
      topLeftRotatedPoint[0] < topRightRotatedPoint[0] &&
      topLeftRotatedPoint[1] >= topRightRotatedPoint[1]
    ) {
      x1 = Math.min(x1, counterRotateBoundTextBottomLeft[0]);
      x2 = Math.max(
        x2,
        Math.max(
          counterRotateBoundTextTopRight[0],
          counterRotateBoundTextBottomRight[0]
        )
      );

      y1 = Math.min(y1, counterRotateBoundTextTopLeft[1]);
      y2 = Math.max(y2, counterRotateBoundTextBottomRight[1]);
    } else if (
      topLeftRotatedPoint[0] >= topRightRotatedPoint[0] &&
      topLeftRotatedPoint[1] > topRightRotatedPoint[1]
    ) {
      x1 = Math.min(x1, counterRotateBoundTextBottomRight[0]);
      x2 = Math.max(
        x2,
        Math.max(
          counterRotateBoundTextTopLeft[0],
          counterRotateBoundTextTopRight[0]
        )
      );

      y1 = Math.min(y1, counterRotateBoundTextBottomLeft[1]);
      y2 = Math.max(y2, counterRotateBoundTextTopRight[1]);
    } else if (topLeftRotatedPoint[0] >= topRightRotatedPoint[0]) {
      x1 = Math.min(x1, counterRotateBoundTextTopRight[0]);
      x2 = Math.max(x2, counterRotateBoundTextBottomLeft[0]);
      y1 = Math.min(y1, counterRotateBoundTextBottomRight[1]);
      y2 = Math.max(y2, counterRotateBoundTextTopLeft[1]);
    } else if (topLeftRotatedPoint[1] <= topRightRotatedPoint[1]) {
      x1 = Math.min(
        x1,
        Math.min(
          counterRotateBoundTextTopRight[0],
          counterRotateBoundTextTopLeft[0]
        )
      );
      x2 = Math.max(x2, counterRotateBoundTextBottomRight[0]);

      y1 = Math.min(y1, counterRotateBoundTextTopRight[1]);
      y2 = Math.max(y2, counterRotateBoundTextBottomLeft[1]);
    }

    return [x1, y1, x2, y2, cx, cy];
  };

  /**
   * Returns the absolute coordinates of a layer
   * @param layer Linear layer
   * @param includeBoundText Whether to include bound text
   */
  static getLayerAbsoluteCoords = (
    layer: LinearLayer,
    includeBoundText: boolean = false
  ): [number, number, number, number, number, number] => {
    let coords: [number, number, number, number, number, number];
    let x1: number;
    let y1: number;
    let x2: number;
    let y2: number;

    if (layer.points.length < 2 || !getShapeForLayer(layer)) {
      // This is just a poor estimate and not very useful
      const { minX, minY, maxX, maxY } = layer.points.reduce(
        (limits, [x, y]) => {
          limits.minY = Math.min(limits.minY, y);
          limits.minX = Math.min(limits.minX, x);
          limits.maxX = Math.max(limits.maxX, x);
          limits.maxY = Math.max(limits.maxY, y);

          return limits;
        },
        { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity }
      );

      x1 = minX + layer.x;
      y1 = minY + layer.y;
      x2 = maxX + layer.x;
      y2 = maxY + layer.y;
    } else {
      const shape = getShapeForLayer(layer)!;

      // The first layer is always the curve
      const ops = getCurvePathOps(shape[0]);
      const [minX, minY, maxX, maxY] = getMinMaxXYFromCurvePathOps(ops);

      x1 = minX + layer.x;
      y1 = minY + layer.y;
      x2 = maxX + layer.x;
      y2 = maxY + layer.y;
    }

    const cx = (x1 + x2) / 2;
    const cy = (y1 + y2) / 2;
    coords = [x1, y1, x2, y2, cx, cy];

    if (!includeBoundText) {
      return coords;
    }

    const boundTextLayer = getBoundTextLayer(layer);

    if (boundTextLayer) {
      coords = LinearLayerEditor.getMinMaxXYWithBoundText(
        layer,
        [x1, y1, x2, y2],
        boundTextLayer
      );
    }

    return coords;
  };
}
