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
} from "../../lib/math/math";
import Scene from "../../lib/scene/scene/Scene";
import { DRAGGING_THRESHOLD } from "../constants";
import History from "../history";
import { shouldRotateWithDiscreteAngle } from "../keys";
import { getShapeForLayer } from "../renderer/renderLayer";
import { AppState, Point, PointerCoords } from "../types";
import { Mutable } from "../utility-types";
import { tupleToCoors } from "../utils";
import { getLayerAbsoluteCoords, getLockedLinearCursorAlignSize } from ".";
import {
  bindOrUnbindLinearLayer,
  getHoveredLayerForBinding,
  isBindingEnabled
} from "./binding";
import {
  getCurvePathOps,
  getLayerPointsCoords,
  getMinMaxXYFromCurvePathOps
} from "./bounds";
import { mutateLayer } from "./mutateLayer";
import { getBoundTextLayer, handleBindTextResize } from "./textLayer";
import { isBindingLayer } from "./typeChecks";
import {
  ExcalidrawBindableLayer,
  ExcalidrawLayer,
  ExcalidrawLinearLayer,
  ExcalidrawTextLayerWithContainer,
  NonDeleted,
  PointBinding
} from "./types";

const editorMidPointsCache: {
  points: (Point | null)[];
  version: number | null;
  zoom: number | null;
} = { version: null, points: [], zoom: null };
export class LinearLayerEditor {
  public readonly layerId: ExcalidrawLayer["id"] & {
    _brand: "excalidrawLinearLayerId";
  };
  /** indices */
  public readonly selectedPointsIndices: readonly number[] | null;

  public readonly pointerDownState: Readonly<{
    /** index */
    lastClickedPoint: number;
    origin: Readonly<{ x: number; y: number }> | null;
    prevSelectedPointsIndices: readonly number[] | null;
    segmentMidpoint: {
      added: boolean;
      index: number | null;
      value: Point | null;
    };
  }>;

  /** whether you're dragging a point */
  public readonly isDragging: boolean;
  public readonly lastUncommittedPoint: Point | null;
  public readonly pointerOffset: Readonly<{ x: number; y: number }>;
  public readonly startBindingLayer: ExcalidrawBindableLayer | null | "keep";
  public readonly endBindingLayer: ExcalidrawBindableLayer | null | "keep";
  public readonly hoverPointIndex: number;
  public readonly segmentMidPointHoveredCoords: Point | null;

  constructor(layer: NonDeleted<ExcalidrawLinearLayer>, scene: Scene) {
    this.layerId = layer.id as string & {
      _brand: "excalidrawLinearLayerId";
    };
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

  // ---------------------------------------------------------------------------
  // static methods
  // ---------------------------------------------------------------------------

  static POINT_HANDLE_SIZE = 10;
  /**
   * @param id the `layerId` from the instance of this class (so that we can
   *  statically guarantee this method returns an ExcalidrawLinearLayer)
   */
  static getLayer(id: InstanceType<typeof LinearLayerEditor>["layerId"]) {
    const layer = Scene.getScene(id)?.getNonDeletedLayer(id);
    if (layer) {
      return layer as NonDeleted<ExcalidrawLinearLayer>;
    }
    return null;
  }

  static handleBoxSelection(
    event: PointerEvent,
    appState: AppState,
    setState: React.Component<any, AppState>["setState"]
  ) {
    if (
      !appState.editingLinearLayer ||
      appState.draggingLayer?.type !== "selection"
    ) {
      return false;
    }
    const { editingLinearLayer } = appState;
    const { selectedPointsIndices, layerId } = editingLinearLayer;

    const layer = LinearLayerEditor.getLayer(layerId);
    if (!layer) {
      return false;
    }

    const [selectionX1, selectionY1, selectionX2, selectionY2] =
      getLayerAbsoluteCoords(appState.draggingLayer);

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

  /** @returns whether point was dragged */
  static handlePointDragging(
    event: PointerEvent,
    appState: AppState,
    scenePointerX: number,
    scenePointerY: number,
    maybeSuggestBinding: (
      layer: NonDeleted<ExcalidrawLinearLayer>,
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

    // point that's being dragged (out of all selected points)
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

        const [width, height] = LinearLayerEditor._getShiftLockedDelta(
          layer,
          referencePoint,
          [scenePointerX, scenePointerY],
          appState.gridSize
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
          appState.gridSize
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
                    appState.gridSize
                  )
                : ([
                    layer.points[pointIndex][0] + deltaX,
                    layer.points[pointIndex][1] + deltaY
                  ] as const);
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

      // suggest bindings for first and last point if selected
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

  static handlePointerUp(
    event: PointerEvent,
    editingLinearLayer: LinearLayerEditor,
    appState: AppState
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
          if (isPathALoop(layer.points, appState.zoom.value)) {
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

          const bindingLayer = isBindingEnabled(appState)
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

          bindings[
            selectedPoint === 0 ? "startBindingLayer" : "endBindingLayer"
          ] = bindingLayer;
        }
      }
    }

    return {
      ...editingLinearLayer,
      ...bindings,
      // if clicking without previously dragging a point(s), and not holding
      // shift, deselect all points except the one clicked. If holding shift,
      // toggle the point.
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

  static getEditorMidPoints = (
    layer: NonDeleted<ExcalidrawLinearLayer>,
    appState: AppState
  ): (typeof editorMidPointsCache)["points"] => {
    const boundText = getBoundTextLayer(layer);

    // Since its not needed outside editor unless 2 pointer lines or bound text
    if (!appState.editingLinearLayer && layer.points.length > 2 && !boundText) {
      return [];
    }
    if (
      editorMidPointsCache.version === layer.version &&
      editorMidPointsCache.zoom === appState.zoom.value
    ) {
      return editorMidPointsCache.points;
    }
    LinearLayerEditor.updateEditorMidPointsCache(layer, appState);
    return editorMidPointsCache.points!;
  };

  static updateEditorMidPointsCache = (
    layer: NonDeleted<ExcalidrawLinearLayer>,
    appState: AppState
  ) => {
    const points = LinearLayerEditor.getPointsGlobalCoordinates(layer);

    let index = 0;
    const midpoints: (Point | null)[] = [];
    while (index < points.length - 1) {
      if (
        LinearLayerEditor.isSegmentTooShort(
          layer,
          layer.points[index],
          layer.points[index + 1],
          appState.zoom
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
    editorMidPointsCache.version = layer.version;
    editorMidPointsCache.zoom = appState.zoom.value;
  };

  static getSegmentMidpointHitCoords = (
    linearLayerEditor: LinearLayerEditor,
    scenePointer: { x: number; y: number },
    appState: AppState
  ) => {
    const { layerId } = linearLayerEditor;
    const layer = LinearLayerEditor.getLayer(layerId);
    if (!layer) {
      return null;
    }
    const clickedPointIndex = LinearLayerEditor.getPointIndexUnderCursor(
      layer,
      appState.zoom,
      scenePointer.x,
      scenePointer.y
    );
    if (clickedPointIndex >= 0) {
      return null;
    }
    const points = LinearLayerEditor.getPointsGlobalCoordinates(layer);
    if (points.length >= 3 && !appState.editingLinearLayer) {
      return null;
    }

    const threshold = LinearLayerEditor.POINT_HANDLE_SIZE / appState.zoom.value;

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
      LinearLayerEditor.getEditorMidPoints(layer, appState);
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

  static isSegmentTooShort(
    layer: NonDeleted<ExcalidrawLinearLayer>,
    startPoint: Point,
    endPoint: Point,
    zoom: AppState["zoom"]
  ) {
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

  static getSegmentMidPoint(
    layer: NonDeleted<ExcalidrawLinearLayer>,
    startPoint: Point,
    endPoint: Point,
    endPointIndex: number
  ) {
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
        ]);
      }
    }

    return segmentMidPoint;
  }

  static getSegmentMidPointIndex(
    linearLayerEditor: LinearLayerEditor,
    appState: AppState,
    midPoint: Point
  ) {
    const layer = LinearLayerEditor.getLayer(linearLayerEditor.layerId);
    if (!layer) {
      return -1;
    }
    const midPoints = LinearLayerEditor.getEditorMidPoints(layer, appState);
    let index = 0;
    while (index < midPoints.length) {
      if (LinearLayerEditor.arePointsEqual(midPoint, midPoints[index])) {
        return index + 1;
      }
      index++;
    }
    return -1;
  }

  static handlePointerDown(
    event: React.PointerEvent<HTMLLayer>,
    appState: AppState,
    history: History,
    scenePointer: { x: number; y: number },
    linearLayerEditor: LinearLayerEditor
  ): {
    didAddPoint: boolean;
    hitLayer: NonDeleted<ExcalidrawLayer> | null;
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
      appState
    );
    let segmentMidpointIndex = null;
    if (segmentMidpoint) {
      segmentMidpointIndex = LinearLayerEditor.getSegmentMidPointIndex(
        linearLayerEditor,
        appState,
        segmentMidpoint
      );
    }
    if (event.altKey && appState.editingLinearLayer) {
      if (linearLayerEditor.lastUncommittedPoint == null) {
        mutateLayer(layer, {
          points: [
            ...layer.points,
            LinearLayerEditor.createPointAt(
              layer,
              scenePointer.x,
              scenePointer.y,
              appState.gridSize
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
      appState.zoom,
      scenePointer.x,
      scenePointer.y
    );
    // if we clicked on a point, set the layer as hitLayer otherwise
    // it would get deselected if the point is outside the hitbox area
    if (clickedPointIndex >= 0 || segmentMidpoint) {
      ret.hitLayer = layer;
    } else {
      // You might be wandering why we are storing the binding layers on
      // LinearLayerEditor and passing them in, instead of calculating them
      // from the end points of the `linearLayer` - this is to allow disabling
      // binding (which needs to happen at the point the user finishes moving
      // the point).
      const { startBindingLayer, endBindingLayer } = linearLayerEditor;
      if (isBindingEnabled(appState) && isBindingLayer(layer)) {
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

  static arePointsEqual(point1: Point | null, point2: Point | null) {
    if (!point1 && !point2) {
      return true;
    }
    if (!point1 || !point2) {
      return false;
    }
    return arePointsEqual(point1, point2);
  }

  static handlePointerMove(
    event: React.PointerEvent<HTMLCanvasLayer>,
    scenePointerX: number,
    scenePointerY: number,
    appState: AppState
  ): LinearLayerEditor | null {
    if (!appState.editingLinearLayer) {
      return null;
    }
    const { layerId, lastUncommittedPoint } = appState.editingLinearLayer;
    const layer = LinearLayerEditor.getLayer(layerId);
    if (!layer) {
      return appState.editingLinearLayer;
    }

    const { points } = layer;
    const lastPoint = points[points.length - 1];

    if (!event.altKey) {
      if (lastPoint === lastUncommittedPoint) {
        LinearLayerEditor.deletePoints(layer, [points.length - 1]);
      }
      return {
        ...appState.editingLinearLayer,
        lastUncommittedPoint: null
      };
    }

    let newPoint: Point;

    if (shouldRotateWithDiscreteAngle(event) && points.length >= 2) {
      const lastCommittedPoint = points[points.length - 2];

      const [width, height] = LinearLayerEditor._getShiftLockedDelta(
        layer,
        lastCommittedPoint,
        [scenePointerX, scenePointerY],
        appState.gridSize
      );

      newPoint = [
        width + lastCommittedPoint[0],
        height + lastCommittedPoint[1]
      ];
    } else {
      newPoint = LinearLayerEditor.createPointAt(
        layer,
        scenePointerX - appState.editingLinearLayer.pointerOffset.x,
        scenePointerY - appState.editingLinearLayer.pointerOffset.y,
        appState.gridSize
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
      LinearLayerEditor.addPoints(layer, appState, [{ point: newPoint }]);
    }
    return {
      ...appState.editingLinearLayer,
      lastUncommittedPoint: layer.points[layer.points.length - 1]
    };
  }

  /** scene coords */
  static getPointGlobalCoordinates(
    layer: NonDeleted<ExcalidrawLinearLayer>,
    point: Point
  ) {
    const [x1, y1, x2, y2] = getLayerAbsoluteCoords(layer);
    const cx = (x1 + x2) / 2;
    const cy = (y1 + y2) / 2;

    let { x, y } = layer;
    [x, y] = rotate(x + point[0], y + point[1], cx, cy, layer.angle);
    return [x, y] as const;
  }

  /** scene coords */
  static getPointsGlobalCoordinates(
    layer: NonDeleted<ExcalidrawLinearLayer>
  ): Point[] {
    const [x1, y1, x2, y2] = getLayerAbsoluteCoords(layer);
    const cx = (x1 + x2) / 2;
    const cy = (y1 + y2) / 2;
    return layer.points.map((point) => {
      let { x, y } = layer;
      [x, y] = rotate(x + point[0], y + point[1], cx, cy, layer.angle);
      return [x, y] as const;
    });
  }

  static getPointAtIndexGlobalCoordinates(
    layer: NonDeleted<ExcalidrawLinearLayer>,
    indexMaybeFromEnd: number // -1 for last layer
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

  static pointFromAbsoluteCoords(
    layer: NonDeleted<ExcalidrawLinearLayer>,
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

  static getPointIndexUnderCursor(
    layer: NonDeleted<ExcalidrawLinearLayer>,
    zoom: AppState["zoom"],
    x: number,
    y: number
  ) {
    const pointHandles = LinearLayerEditor.getPointsGlobalCoordinates(layer);
    let idx = pointHandles.length;
    // loop from right to left because points on the right are rendered over
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

  static createPointAt(
    layer: NonDeleted<ExcalidrawLinearLayer>,
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
   * Normalizes line points so that the start point is at [0,0]. This is
   * expected in various parts of the codebase. Also returns new x/y to account
   * for the potential normalization.
   */
  static getNormalizedPoints(layer: ExcalidrawLinearLayer) {
    const { points } = layer;

    const offsetX = points[0][0];
    const offsetY = points[0][1];

    return {
      points: points.map(
        (point, _idx) => [point[0] - offsetX, point[1] - offsetY] as const
      ),
      x: layer.x + offsetX,
      y: layer.y + offsetY
    };
  }

  // layer-mutating methods
  // ---------------------------------------------------------------------------

  static normalizePoints(layer: NonDeleted<ExcalidrawLinearLayer>) {
    mutateLayer(layer, LinearLayerEditor.getNormalizedPoints(layer));
  }

  static duplicateSelectedPoints(appState: AppState) {
    if (!appState.editingLinearLayer) {
      return false;
    }

    const { selectedPointsIndices, layerId } = appState.editingLinearLayer;

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

    // temp hack to ensure the line doesn't move when adding point to the end,
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
      appState: {
        ...appState,
        editingLinearLayer: {
          ...appState.editingLinearLayer,
          selectedPointsIndices: nextSelectedIndices
        }
      }
    };
  }

  static deletePoints(
    layer: NonDeleted<ExcalidrawLinearLayer>,
    pointIndices: readonly number[]
  ) {
    let offsetX = 0;
    let offsetY = 0;

    const isDeletingOriginPoint = pointIndices.includes(0);

    // if deleting first point, make the next to be [0,0] and recalculate
    // positions of the rest with respect to it
    if (isDeletingOriginPoint) {
      const firstNonDeletedPoint = layer.points.find(
        (point, idx) => !pointIndices.includes(idx)
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

    LinearLayerEditor._updatePoints(layer, nextPoints, offsetX, offsetY);
  }

  static addPoints(
    layer: NonDeleted<ExcalidrawLinearLayer>,
    appState: AppState,
    targetPoints: { point: Point }[]
  ) {
    const offsetX = 0;
    const offsetY = 0;

    const nextPoints = [...layer.points, ...targetPoints.map((x) => x.point)];
    LinearLayerEditor._updatePoints(layer, nextPoints, offsetX, offsetY);
  }

  static movePoints(
    layer: NonDeleted<ExcalidrawLinearLayer>,
    targetPoints: { index: number; isDragging?: boolean; point: Point }[],
    otherUpdates?: { endBinding?: PointBinding; startBinding?: PointBinding }
  ) {
    const { points } = layer;

    // in case we're moving start point, instead of modifying its position
    // which would break the invariant of it being at [0,0], we move
    // all the other points in the opposite direction by delta to
    // offset it. We do the same with actual layer.x/y position, so
    // this hacks are completely transparent to the user.
    let offsetX = 0;
    let offsetY = 0;

    const selectedOriginPoint = targetPoints.find(({ index }) => index === 0);

    if (selectedOriginPoint) {
      offsetX =
        selectedOriginPoint.point[0] + points[selectedOriginPoint.index][0];
      offsetY =
        selectedOriginPoint.point[1] + points[selectedOriginPoint.index][1];
    }

    const nextPoints = points.map((point, idx) => {
      const selectedPointData = targetPoints.find((p) => p.index === idx);
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

    LinearLayerEditor._updatePoints(
      layer,
      nextPoints,
      offsetX,
      offsetY,
      otherUpdates
    );
  }

  static shouldAddMidpoint(
    linearLayerEditor: LinearLayerEditor,
    pointerCoords: PointerCoords,
    appState: AppState
  ) {
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
    if (
      !appState.editingLinearLayer &&
      dist < DRAGGING_THRESHOLD / appState.zoom.value
    ) {
      return false;
    }
    return true;
  }

  static addMidpoint(
    linearLayerEditor: LinearLayerEditor,
    pointerCoords: PointerCoords,
    appState: AppState
  ) {
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
      appState.gridSize
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

  private static _updatePoints(
    layer: NonDeleted<ExcalidrawLinearLayer>,
    nextPoints: readonly Point[],
    offsetX: number,
    offsetY: number,
    otherUpdates?: { endBinding?: PointBinding; startBinding?: PointBinding }
  ) {
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

  private static _getShiftLockedDelta(
    layer: NonDeleted<ExcalidrawLinearLayer>,
    referencePoint: Point,
    scenePointer: Point,
    gridSize: number | null
  ) {
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

  static getBoundTextLayerPosition = (
    layer: ExcalidrawLinearLayer,
    boundTextLayer: ExcalidrawTextLayerWithContainer
  ): { x: number; y: number } => {
    const points = LinearLayerEditor.getPointsGlobalCoordinates(layer);
    if (points.length < 2) {
      mutateLayer(boundTextLayer, { isDeleted: true });
    }
    let x = 0;
    let y = 0;
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
      if (
        !midSegmentMidpoint ||
        editorMidPointsCache.version !== layer.version
      ) {
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

  static getMinMaxXYWithBoundText = (
    layer: ExcalidrawLinearLayer,
    layerBounds: [number, number, number, number],
    boundTextLayer: ExcalidrawTextLayerWithContainer
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

  static getLayerAbsoluteCoords = (
    layer: ExcalidrawLinearLayer,
    includeBoundText: boolean = false
  ): [number, number, number, number, number, number] => {
    let coords: [number, number, number, number, number, number];
    let x1;
    let y1;
    let x2;
    let y2;
    if (layer.points.length < 2 || !getShapeForLayer(layer)) {
      // XXX this is just a poor estimate and not very useful
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

      // first layer is always the curve
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

const normalizeSelectedPoints = (
  points: (number | null)[]
): number[] | null => {
  let nextPoints = [
    ...new Set(points.filter((p) => p !== null && p !== -1))
  ] as number[];
  nextPoints = nextPoints.sort((a, b) => a - b);
  return nextPoints.length ? nextPoints : null;
};
