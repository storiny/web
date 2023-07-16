import { pointsOnBezierCurves } from "points-on-curve";
import { Drawable } from "roughjs/bin/core";

import {
  distance2d,
  isPathALoop,
  isPointInPolygon,
  rotate,
  rotatePoint
} from "../../lib/math/math";
import * as GA from "../ga";
import * as GADirection from "../gadirections";
import * as GALine from "../galines";
import * as GAPoint from "../gapoints";
import * as GATransform from "../gatransforms";
import { getShapeForLayer } from "../renderer/renderLayer";
import { FrameNameBoundsCache, Point } from "../types";
import { AppState } from "../types";
import { Mutable } from "../utility-types";
import { isTransparent } from "../utils";
import { isTextLayer } from ".";
import {
  getCurvePathOps,
  getLayerAbsoluteCoords,
  getRectangleBoxAbsoluteCoords,
  RectangleBox
} from "./bounds";
import { getBoundTextLayer } from "./textLayer";
import { shouldShowBoundingBox } from "./transformHandles";
import { hasBoundTextLayer, isImageLayer } from "./typeChecks";
import {
  ExcalidrawBindableLayer,
  ExcalidrawDiamondLayer,
  ExcalidrawEllipseLayer,
  ExcalidrawFrameLayer,
  ExcalidrawFreeDrawLayer,
  ExcalidrawImageLayer,
  ExcalidrawLayer,
  ExcalidrawLinearLayer,
  ExcalidrawRectangleLayer,
  ExcalidrawTextLayer,
  NonDeleted,
  NonDeletedExcalidrawLayer,
  StrokeRoundness
} from "./types";

const isLayerDraggableFromInside = (
  layer: NonDeletedExcalidrawLayer
): boolean => {
  if (layer.type === "arrow") {
    return false;
  }

  if (layer.type === "freedraw") {
    return true;
  }
  const isDraggableFromInside =
    !isTransparent(layer.backgroundColor) || hasBoundTextLayer(layer);
  if (layer.type === "line") {
    return isDraggableFromInside && isPathALoop(layer.points);
  }
  return isDraggableFromInside || isImageLayer(layer);
};

export const hitTest = (
  layer: NonDeletedExcalidrawLayer,
  appState: AppState,
  frameNameBoundsCache: FrameNameBoundsCache,
  x: number,
  y: number
): boolean => {
  // How many pixels off the shape boundary we still consider a hit
  const threshold = 10 / appState.zoom.value;
  const point: Point = [x, y];

  if (
    isLayerSelected(appState, layer) &&
    shouldShowBoundingBox([layer], appState)
  ) {
    return isPointHittingLayerBoundingBox(
      layer,
      point,
      threshold,
      frameNameBoundsCache
    );
  }

  const boundTextLayer = getBoundTextLayer(layer);
  if (boundTextLayer) {
    const isHittingBoundTextLayer = hitTest(
      boundTextLayer,
      appState,
      frameNameBoundsCache,
      x,
      y
    );
    if (isHittingBoundTextLayer) {
      return true;
    }
  }
  return isHittingLayerNotConsideringBoundingBox(
    layer,
    appState,
    frameNameBoundsCache,
    point
  );
};

export const isHittingLayerBoundingBoxWithoutHittingLayer = (
  layer: NonDeletedExcalidrawLayer,
  appState: AppState,
  frameNameBoundsCache: FrameNameBoundsCache,
  x: number,
  y: number
): boolean => {
  const threshold = 10 / appState.zoom.value;

  // So that bound text layer hit is considered within bounding box of container even if its outside actual bounding box of layer
  // eg for linear layers text can be outside the layer bounding box
  const boundTextLayer = getBoundTextLayer(layer);
  if (
    boundTextLayer &&
    hitTest(boundTextLayer, appState, frameNameBoundsCache, x, y)
  ) {
    return false;
  }

  return (
    !isHittingLayerNotConsideringBoundingBox(
      layer,
      appState,
      frameNameBoundsCache,
      [x, y]
    ) &&
    isPointHittingLayerBoundingBox(
      layer,
      [x, y],
      threshold,
      frameNameBoundsCache
    )
  );
};

export const isHittingLayerNotConsideringBoundingBox = (
  layer: NonDeletedExcalidrawLayer,
  appState: AppState,
  frameNameBoundsCache: FrameNameBoundsCache | null,
  point: Point
): boolean => {
  const threshold = 10 / appState.zoom.value;
  const check = isTextLayer(layer)
    ? isStrictlyInside
    : isLayerDraggableFromInside(layer)
    ? isInsideCheck
    : isNearCheck;
  return hitTestPointAgainstLayer({
    layer,
    point,
    threshold,
    check,
    frameNameBoundsCache
  });
};

const isLayerSelected = (
  appState: AppState,
  layer: NonDeleted<ExcalidrawLayer>
) => appState.selectedLayerIds[layer.id];

export const isPointHittingLayerBoundingBox = (
  layer: NonDeleted<ExcalidrawLayer>,
  [x, y]: Point,
  threshold: number,
  frameNameBoundsCache: FrameNameBoundsCache | null
) => {
  // frames needs be checked differently so as to be able to drag it
  // by its frame, whether it has been selected or not
  // this logic here is not ideal
  // TODO: refactor it later...
  if (layer.type === "frame") {
    return hitTestPointAgainstLayer({
      layer,
      point: [x, y],
      threshold,
      check: isInsideCheck,
      frameNameBoundsCache
    });
  }

  const [x1, y1, x2, y2] = getLayerAbsoluteCoords(layer);
  const layerCenterX = (x1 + x2) / 2;
  const layerCenterY = (y1 + y2) / 2;
  // reverse rotate to take layer's angle into account.
  const [rotatedX, rotatedY] = rotate(
    x,
    y,
    layerCenterX,
    layerCenterY,
    -layer.angle
  );

  return (
    rotatedX > x1 - threshold &&
    rotatedX < x2 + threshold &&
    rotatedY > y1 - threshold &&
    rotatedY < y2 + threshold
  );
};

export const bindingBorderTest = (
  layer: NonDeleted<ExcalidrawBindableLayer>,
  { x, y }: { x: number; y: number }
): boolean => {
  const threshold = maxBindingGap(layer, layer.width, layer.height);
  const check = isOutsideCheck;
  const point: Point = [x, y];
  return hitTestPointAgainstLayer({
    layer,
    point,
    threshold,
    check,
    frameNameBoundsCache: null
  });
};

export const maxBindingGap = (
  layer: ExcalidrawLayer,
  layerWidth: number,
  layerHeight: number
): number => {
  // Aligns diamonds with rectangles
  const shapeRatio = layer.type === "diamond" ? 1 / Math.sqrt(2) : 1;
  const smallerDimension = shapeRatio * Math.min(layerWidth, layerHeight);
  // We make the bindable boundary bigger for bigger layers
  return Math.max(16, Math.min(0.25 * smallerDimension, 32));
};

type HitTestArgs = {
  check: (distance: number, threshold: number) => boolean;
  frameNameBoundsCache: FrameNameBoundsCache | null;
  layer: NonDeletedExcalidrawLayer;
  point: Point;
  threshold: number;
};

const hitTestPointAgainstLayer = (args: HitTestArgs): boolean => {
  switch (args.layer.type) {
    case "rectangle":
    case "image":
    case "text":
    case "diamond":
    case "ellipse":
      const distance = distanceToBindableLayer(args.layer, args.point);
      return args.check(distance, args.threshold);
    case "freedraw": {
      if (
        !args.check(distanceToRectangle(args.layer, args.point), args.threshold)
      ) {
        return false;
      }

      return hitTestFreeDrawLayer(args.layer, args.point, args.threshold);
    }
    case "arrow":
    case "line":
      return hitTestLinear(args);
    case "selection":
      console.warn(
        "This should not happen, we need to investigate why it does."
      );
      return false;
    case "frame": {
      // check distance to frame layer first
      if (
        args.check(
          distanceToBindableLayer(args.layer, args.point),
          args.threshold
        )
      ) {
        return true;
      }

      const frameNameBounds = args.frameNameBoundsCache?.get(args.layer);

      if (frameNameBounds) {
        return args.check(
          distanceToRectangleBox(frameNameBounds, args.point),
          args.threshold
        );
      }
      return false;
    }
  }
};

export const distanceToBindableLayer = (
  layer: ExcalidrawBindableLayer,
  point: Point
): number => {
  switch (layer.type) {
    case "rectangle":
    case "image":
    case "text":
    case "frame":
      return distanceToRectangle(layer, point);
    case "diamond":
      return distanceToDiamond(layer, point);
    case "ellipse":
      return distanceToEllipse(layer, point);
  }
};

const isStrictlyInside = (distance: number, threshold: number): boolean =>
  distance < 0;

const isInsideCheck = (distance: number, threshold: number): boolean =>
  distance < threshold;

const isNearCheck = (distance: number, threshold: number): boolean =>
  Math.abs(distance) < threshold;

const isOutsideCheck = (distance: number, threshold: number): boolean =>
  0 <= distance && distance < threshold;

const distanceToRectangle = (
  layer:
    | ExcalidrawRectangleLayer
    | ExcalidrawTextLayer
    | ExcalidrawFreeDrawLayer
    | ExcalidrawImageLayer
    | ExcalidrawFrameLayer,
  point: Point
): number => {
  const [, pointRel, hwidth, hheight] = pointRelativeToLayer(layer, point);
  return Math.max(
    GAPoint.distanceToLine(pointRel, GALine.equation(0, 1, -hheight)),
    GAPoint.distanceToLine(pointRel, GALine.equation(1, 0, -hwidth))
  );
};

const distanceToRectangleBox = (box: RectangleBox, point: Point): number => {
  const [, pointRel, hwidth, hheight] = pointRelativeToDivLayer(point, box);
  return Math.max(
    GAPoint.distanceToLine(pointRel, GALine.equation(0, 1, -hheight)),
    GAPoint.distanceToLine(pointRel, GALine.equation(1, 0, -hwidth))
  );
};

const distanceToDiamond = (
  layer: ExcalidrawDiamondLayer,
  point: Point
): number => {
  const [, pointRel, hwidth, hheight] = pointRelativeToLayer(layer, point);
  const side = GALine.equation(hheight, hwidth, -hheight * hwidth);
  return GAPoint.distanceToLine(pointRel, side);
};

const distanceToEllipse = (
  layer: ExcalidrawEllipseLayer,
  point: Point
): number => {
  const [pointRel, tangent] = ellipseParamsForTest(layer, point);
  return -GALine.sign(tangent) * GAPoint.distanceToLine(pointRel, tangent);
};

const ellipseParamsForTest = (
  layer: ExcalidrawEllipseLayer,
  point: Point
): [GA.Point, GA.Line] => {
  const [, pointRel, hwidth, hheight] = pointRelativeToLayer(layer, point);
  const [px, py] = GAPoint.toTuple(pointRel);

  // We're working in positive quadrant, so start with `t = 45deg`, `tx=cos(t)`
  let tx = 0.707;
  let ty = 0.707;

  const a = hwidth;
  const b = hheight;

  // This is a numerical method to find the params tx, ty at which
  // the ellipse has the closest point to the given point
  [0, 1, 2, 3].forEach((_) => {
    const xx = a * tx;
    const yy = b * ty;

    const ex = ((a * a - b * b) * tx ** 3) / a;
    const ey = ((b * b - a * a) * ty ** 3) / b;

    const rx = xx - ex;
    const ry = yy - ey;

    const qx = px - ex;
    const qy = py - ey;

    const r = Math.hypot(ry, rx);
    const q = Math.hypot(qy, qx);

    tx = Math.min(1, Math.max(0, ((qx * r) / q + ex) / a));
    ty = Math.min(1, Math.max(0, ((qy * r) / q + ey) / b));
    const t = Math.hypot(ty, tx);
    tx /= t;
    ty /= t;
  });

  const closestPoint = GA.point(a * tx, b * ty);

  const tangent = GALine.orthogonalThrough(pointRel, closestPoint);
  return [pointRel, tangent];
};

const hitTestFreeDrawLayer = (
  layer: ExcalidrawFreeDrawLayer,
  point: Point,
  threshold: number
): boolean => {
  // Check point-distance-to-line-segment for every segment in the
  // layer's points (its input points, not its outline points).
  // This is... okay? It's plenty fast, but the GA library may
  // have a faster option.

  let x: number;
  let y: number;

  if (layer.angle === 0) {
    x = point[0] - layer.x;
    y = point[1] - layer.y;
  } else {
    // Counter-rotate the point around center before testing
    const [minX, minY, maxX, maxY] = getLayerAbsoluteCoords(layer);
    const rotatedPoint = rotatePoint(
      point,
      [minX + (maxX - minX) / 2, minY + (maxY - minY) / 2],
      -layer.angle
    );
    x = rotatedPoint[0] - layer.x;
    y = rotatedPoint[1] - layer.y;
  }

  let [A, B] = layer.points;
  let P: readonly [number, number];

  // For freedraw dots
  if (
    distance2d(A[0], A[1], x, y) < threshold ||
    distance2d(B[0], B[1], x, y) < threshold
  ) {
    return true;
  }

  // For freedraw lines
  for (let i = 0; i < layer.points.length; i++) {
    const delta = [B[0] - A[0], B[1] - A[1]];
    const length = Math.hypot(delta[1], delta[0]);

    const U = [delta[0] / length, delta[1] / length];
    const C = [x - A[0], y - A[1]];
    const d = (C[0] * U[0] + C[1] * U[1]) / Math.hypot(U[1], U[0]);
    P = [A[0] + U[0] * d, A[1] + U[1] * d];

    const da = distance2d(P[0], P[1], A[0], A[1]);
    const db = distance2d(P[0], P[1], B[0], B[1]);

    P = db < da && da > length ? B : da < db && db > length ? A : P;

    if (Math.hypot(y - P[1], x - P[0]) < threshold) {
      return true;
    }

    A = B;
    B = layer.points[i + 1];
  }

  const shape = getShapeForLayer(layer);

  // for filled freedraw shapes, support
  // selecting from inside
  if (shape && shape.sets.length) {
    return hitTestRoughShape(shape, x, y, threshold);
  }

  return false;
};

const hitTestLinear = (args: HitTestArgs): boolean => {
  const { layer, threshold } = args;
  if (!getShapeForLayer(layer)) {
    return false;
  }

  const [point, pointAbs, hwidth, hheight] = pointRelativeToLayer(
    args.layer,
    args.point
  );
  const side1 = GALine.equation(0, 1, -hheight);
  const side2 = GALine.equation(1, 0, -hwidth);
  if (
    !isInsideCheck(GAPoint.distanceToLine(pointAbs, side1), threshold) ||
    !isInsideCheck(GAPoint.distanceToLine(pointAbs, side2), threshold)
  ) {
    return false;
  }
  const [relX, relY] = GAPoint.toTuple(point);

  const shape = getShapeForLayer(layer as ExcalidrawLinearLayer);

  if (!shape) {
    return false;
  }

  if (args.check === isInsideCheck) {
    const hit = shape.some((subshape) =>
      hitTestCurveInside(
        subshape,
        relX,
        relY,
        layer.roundness ? "round" : "sharp"
      )
    );
    if (hit) {
      return true;
    }
  }

  // hit test all "subshapes" of the linear layer
  return shape.some((subshape) =>
    hitTestRoughShape(subshape, relX, relY, threshold)
  );
};

// Returns:
//   1. the point relative to the layers (x, y) position
//   2. the point relative to the layer's center with positive (x, y)
//   3. half layer width
//   4. half layer height
//
// Note that for linear layers the (x, y) position is not at the
// top right corner of their boundary.
//
// Rectangles, diamonds and ellipses are symmetrical over axes,
// and other layers have a rectangular boundary,
// so we only need to perform hit tests for the positive quadrant.
const pointRelativeToLayer = (
  layer: ExcalidrawLayer,
  pointTuple: Point
): [GA.Point, GA.Point, number, number] => {
  const point = GAPoint.from(pointTuple);
  const [x1, y1, x2, y2] = getLayerAbsoluteCoords(layer);
  const center = coordsCenter(x1, y1, x2, y2);
  // GA has angle orientation opposite to `rotate`
  const rotate = GATransform.rotation(center, layer.angle);
  const pointRotated = GATransform.apply(rotate, point);
  const pointRelToCenter = GA.sub(pointRotated, GADirection.from(center));
  const pointRelToCenterAbs = GAPoint.abs(pointRelToCenter);
  const layerPos = GA.offset(layer.x, layer.y);
  const pointRelToPos = GA.sub(pointRotated, layerPos);
  const halfWidth = (x2 - x1) / 2;
  const halfHeight = (y2 - y1) / 2;
  return [pointRelToPos, pointRelToCenterAbs, halfWidth, halfHeight];
};

const pointRelativeToDivLayer = (
  pointTuple: Point,
  rectangle: RectangleBox
): [GA.Point, GA.Point, number, number] => {
  const point = GAPoint.from(pointTuple);
  const [x1, y1, x2, y2] = getRectangleBoxAbsoluteCoords(rectangle);
  const center = coordsCenter(x1, y1, x2, y2);
  const rotate = GATransform.rotation(center, rectangle.angle);
  const pointRotated = GATransform.apply(rotate, point);
  const pointRelToCenter = GA.sub(pointRotated, GADirection.from(center));
  const pointRelToCenterAbs = GAPoint.abs(pointRelToCenter);
  const layerPos = GA.offset(rectangle.x, rectangle.y);
  const pointRelToPos = GA.sub(pointRotated, layerPos);
  const halfWidth = (x2 - x1) / 2;
  const halfHeight = (y2 - y1) / 2;
  return [pointRelToPos, pointRelToCenterAbs, halfWidth, halfHeight];
};

// Returns point in absolute coordinates
export const pointInAbsoluteCoords = (
  layer: ExcalidrawLayer,
  // Point relative to the layer position
  point: Point
): Point => {
  const [x, y] = point;
  const [x1, y1, x2, y2] = getLayerAbsoluteCoords(layer);
  const cx = (x2 - x1) / 2;
  const cy = (y2 - y1) / 2;
  const [rotatedX, rotatedY] = rotate(x, y, cx, cy, layer.angle);
  return [layer.x + rotatedX, layer.y + rotatedY];
};

const relativizationToLayerCenter = (layer: ExcalidrawLayer): GA.Transform => {
  const [x1, y1, x2, y2] = getLayerAbsoluteCoords(layer);
  const center = coordsCenter(x1, y1, x2, y2);
  // GA has angle orientation opposite to `rotate`
  const rotate = GATransform.rotation(center, layer.angle);
  const translate = GA.reverse(
    GATransform.translation(GADirection.from(center))
  );
  return GATransform.compose(rotate, translate);
};

const coordsCenter = (
  x1: number,
  y1: number,
  x2: number,
  y2: number
): GA.Point => GA.point((x1 + x2) / 2, (y1 + y2) / 2);

// The focus distance is the oriented ratio between the size of
// the `layer` and the "focus image" of the layer on which
// all focus points lie, so it's a number between -1 and 1.
// The line going through `a` and `b` is a tangent to the "focus image"
// of the layer.
export const determineFocusDistance = (
  layer: ExcalidrawBindableLayer,
  // Point on the line, in absolute coordinates
  a: Point,
  // Another point on the line, in absolute coordinates (closer to layer)
  b: Point
): number => {
  const relateToCenter = relativizationToLayerCenter(layer);
  const aRel = GATransform.apply(relateToCenter, GAPoint.from(a));
  const bRel = GATransform.apply(relateToCenter, GAPoint.from(b));
  const line = GALine.through(aRel, bRel);
  const q = layer.height / layer.width;
  const hwidth = layer.width / 2;
  const hheight = layer.height / 2;
  const n = line[2];
  const m = line[3];
  const c = line[1];
  const mabs = Math.abs(m);
  const nabs = Math.abs(n);
  switch (layer.type) {
    case "rectangle":
    case "image":
    case "text":
    case "frame":
      return c / (hwidth * (nabs + q * mabs));
    case "diamond":
      return mabs < nabs ? c / (nabs * hwidth) : c / (mabs * hheight);
    case "ellipse":
      return c / (hwidth * Math.sqrt(n ** 2 + q ** 2 * m ** 2));
  }
};

export const determineFocusPoint = (
  layer: ExcalidrawBindableLayer,
  // The oriented, relative distance from the center of `layer` of the
  // returned focusPoint
  focus: number,
  adjecentPoint: Point
): Point => {
  if (focus === 0) {
    const [x1, y1, x2, y2] = getLayerAbsoluteCoords(layer);
    const center = coordsCenter(x1, y1, x2, y2);
    return GAPoint.toTuple(center);
  }
  const relateToCenter = relativizationToLayerCenter(layer);
  const adjecentPointRel = GATransform.apply(
    relateToCenter,
    GAPoint.from(adjecentPoint)
  );
  const reverseRelateToCenter = GA.reverse(relateToCenter);
  let point;
  switch (layer.type) {
    case "rectangle":
    case "image":
    case "text":
    case "diamond":
    case "frame":
      point = findFocusPointForRectangulars(layer, focus, adjecentPointRel);
      break;
    case "ellipse":
      point = findFocusPointForEllipse(layer, focus, adjecentPointRel);
      break;
  }
  return GAPoint.toTuple(GATransform.apply(reverseRelateToCenter, point));
};

// Returns 2 or 0 intersection points between line going through `a` and `b`
// and the `layer`, in ascending order of distance from `a`.
export const intersectLayerWithLine = (
  layer: ExcalidrawBindableLayer,
  // Point on the line, in absolute coordinates
  a: Point,
  // Another point on the line, in absolute coordinates
  b: Point,
  // If given, the layer is inflated by this value
  gap: number = 0
): Point[] => {
  const relateToCenter = relativizationToLayerCenter(layer);
  const aRel = GATransform.apply(relateToCenter, GAPoint.from(a));
  const bRel = GATransform.apply(relateToCenter, GAPoint.from(b));
  const line = GALine.through(aRel, bRel);
  const reverseRelateToCenter = GA.reverse(relateToCenter);
  const intersections = getSortedLayerLineIntersections(layer, line, aRel, gap);
  return intersections.map((point) =>
    GAPoint.toTuple(GATransform.apply(reverseRelateToCenter, point))
  );
};

const getSortedLayerLineIntersections = (
  layer: ExcalidrawBindableLayer,
  // Relative to layer center
  line: GA.Line,
  // Relative to layer center
  nearPoint: GA.Point,
  gap: number = 0
): GA.Point[] => {
  let intersections: GA.Point[];
  switch (layer.type) {
    case "rectangle":
    case "image":
    case "text":
    case "diamond":
    case "frame":
      const corners = getCorners(layer);
      intersections = corners
        .flatMap((point, i) => {
          const edge: [GA.Point, GA.Point] = [point, corners[(i + 1) % 4]];
          return intersectSegment(line, offsetSegment(edge, gap));
        })
        .concat(
          corners.flatMap((point) => getCircleIntersections(point, gap, line))
        );
      break;
    case "ellipse":
      intersections = getEllipseIntersections(layer, gap, line);
      break;
  }
  if (intersections.length < 2) {
    // Ignore the "edge" case of only intersecting with a single corner
    return [];
  }
  const sortedIntersections = intersections.sort(
    (i1, i2) =>
      GAPoint.distance(i1, nearPoint) - GAPoint.distance(i2, nearPoint)
  );
  return [
    sortedIntersections[0],
    sortedIntersections[sortedIntersections.length - 1]
  ];
};

const getCorners = (
  layer:
    | ExcalidrawRectangleLayer
    | ExcalidrawImageLayer
    | ExcalidrawDiamondLayer
    | ExcalidrawTextLayer
    | ExcalidrawFrameLayer,
  scale: number = 1
): GA.Point[] => {
  const hx = (scale * layer.width) / 2;
  const hy = (scale * layer.height) / 2;
  switch (layer.type) {
    case "rectangle":
    case "image":
    case "text":
    case "frame":
      return [
        GA.point(hx, hy),
        GA.point(hx, -hy),
        GA.point(-hx, -hy),
        GA.point(-hx, hy)
      ];
    case "diamond":
      return [
        GA.point(0, hy),
        GA.point(hx, 0),
        GA.point(0, -hy),
        GA.point(-hx, 0)
      ];
  }
};

// Returns intersection of `line` with `segment`, with `segment` moved by
// `gap` in its polar direction.
// If intersection coincides with second segment point returns empty array.
const intersectSegment = (
  line: GA.Line,
  segment: [GA.Point, GA.Point]
): GA.Point[] => {
  const [a, b] = segment;
  const aDist = GAPoint.distanceToLine(a, line);
  const bDist = GAPoint.distanceToLine(b, line);
  if (aDist * bDist >= 0) {
    // The intersection is outside segment `(a, b)`
    return [];
  }
  return [GAPoint.intersect(line, GALine.through(a, b))];
};

const offsetSegment = (
  segment: [GA.Point, GA.Point],
  distance: number
): [GA.Point, GA.Point] => {
  const [a, b] = segment;
  const offset = GATransform.translationOrthogonal(
    GADirection.fromTo(a, b),
    distance
  );
  return [GATransform.apply(offset, a), GATransform.apply(offset, b)];
};

const getEllipseIntersections = (
  layer: ExcalidrawEllipseLayer,
  gap: number,
  line: GA.Line
): GA.Point[] => {
  const a = layer.width / 2 + gap;
  const b = layer.height / 2 + gap;
  const m = line[2];
  const n = line[3];
  const c = line[1];
  const squares = a * a * m * m + b * b * n * n;
  const discr = squares - c * c;
  if (squares === 0 || discr <= 0) {
    return [];
  }
  const discrRoot = Math.sqrt(discr);
  const xn = -a * a * m * c;
  const yn = -b * b * n * c;
  return [
    GA.point(
      (xn + a * b * n * discrRoot) / squares,
      (yn - a * b * m * discrRoot) / squares
    ),
    GA.point(
      (xn - a * b * n * discrRoot) / squares,
      (yn + a * b * m * discrRoot) / squares
    )
  ];
};

export const getCircleIntersections = (
  center: GA.Point,
  radius: number,
  line: GA.Line
): GA.Point[] => {
  if (radius === 0) {
    return GAPoint.distanceToLine(line, center) === 0 ? [center] : [];
  }
  const m = line[2];
  const n = line[3];
  const c = line[1];
  const [a, b] = GAPoint.toTuple(center);
  const r = radius;
  const squares = m * m + n * n;
  const discr = r * r * squares - (m * a + n * b + c) ** 2;
  if (squares === 0 || discr <= 0) {
    return [];
  }
  const discrRoot = Math.sqrt(discr);
  const xn = a * n * n - b * m * n - m * c;
  const yn = b * m * m - a * m * n - n * c;

  return [
    GA.point((xn + n * discrRoot) / squares, (yn - m * discrRoot) / squares),
    GA.point((xn - n * discrRoot) / squares, (yn + m * discrRoot) / squares)
  ];
};

// The focus point is the tangent point of the "focus image" of the
// `layer`, where the tangent goes through `point`.
export const findFocusPointForEllipse = (
  ellipse: ExcalidrawEllipseLayer,
  // Between -1 and 1 (not 0) the relative size of the "focus image" of
  // the layer on which the focus point lies
  relativeDistance: number,
  // The point for which we're trying to find the focus point, relative
  // to the ellipse center.
  point: GA.Point
): GA.Point => {
  const relativeDistanceAbs = Math.abs(relativeDistance);
  const a = (ellipse.width * relativeDistanceAbs) / 2;
  const b = (ellipse.height * relativeDistanceAbs) / 2;

  const orientation = Math.sign(relativeDistance);
  const [px, pyo] = GAPoint.toTuple(point);

  // The calculation below can't handle py = 0
  const py = pyo === 0 ? 0.0001 : pyo;

  const squares = px ** 2 * b ** 2 + py ** 2 * a ** 2;
  // Tangent mx + ny + 1 = 0
  const m =
    (-px * b ** 2 +
      orientation * py * Math.sqrt(Math.max(0, squares - a ** 2 * b ** 2))) /
    squares;

  let n = (-m * px - 1) / py;

  if (n === 0) {
    // if zero {-0, 0}, fall back to a same-sign value in the similar range
    n = (Object.is(n, -0) ? -1 : 1) * 0.01;
  }

  const x = -(a ** 2 * m) / (n ** 2 * b ** 2 + m ** 2 * a ** 2);
  return GA.point(x, (-m * x - 1) / n);
};

export const findFocusPointForRectangulars = (
  layer:
    | ExcalidrawRectangleLayer
    | ExcalidrawImageLayer
    | ExcalidrawDiamondLayer
    | ExcalidrawTextLayer
    | ExcalidrawFrameLayer,
  // Between -1 and 1 for how far away should the focus point be relative
  // to the size of the layer. Sign determines orientation.
  relativeDistance: number,
  // The point for which we're trying to find the focus point, relative
  // to the layer center.
  point: GA.Point
): GA.Point => {
  const relativeDistanceAbs = Math.abs(relativeDistance);
  const orientation = Math.sign(relativeDistance);
  const corners = getCorners(layer, relativeDistanceAbs);

  let maxDistance = 0;
  let tangentPoint: null | GA.Point = null;
  corners.forEach((corner) => {
    const distance = orientation * GALine.through(point, corner)[1];
    if (distance > maxDistance) {
      maxDistance = distance;
      tangentPoint = corner;
    }
  });
  return tangentPoint!;
};

const pointInBezierEquation = (
  p0: Point,
  p1: Point,
  p2: Point,
  p3: Point,
  [mx, my]: Point,
  lineThreshold: number
) => {
  // B(t) = p0 * (1-t)^3 + 3p1 * t * (1-t)^2 + 3p2 * t^2 * (1-t) + p3 * t^3
  const equation = (t: number, idx: number) =>
    Math.pow(1 - t, 3) * p3[idx] +
    3 * t * Math.pow(1 - t, 2) * p2[idx] +
    3 * Math.pow(t, 2) * (1 - t) * p1[idx] +
    p0[idx] * Math.pow(t, 3);

  // go through t in increments of 0.01
  let t = 0;
  while (t <= 1.0) {
    const tx = equation(t, 0);
    const ty = equation(t, 1);

    const diff = Math.sqrt(Math.pow(tx - mx, 2) + Math.pow(ty - my, 2));

    if (diff < lineThreshold) {
      return true;
    }

    t += 0.01;
  }

  return false;
};

const hitTestCurveInside = (
  drawable: Drawable,
  x: number,
  y: number,
  roundness: StrokeRoundness
) => {
  const ops = getCurvePathOps(drawable);
  const points: Mutable<Point>[] = [];
  let odd = false; // select one line out of double lines
  for (const operation of ops) {
    if (operation.op === "move") {
      odd = !odd;
      if (odd) {
        points.push([operation.data[0], operation.data[1]]);
      }
    } else if (operation.op === "bcurveTo") {
      if (odd) {
        points.push([operation.data[0], operation.data[1]]);
        points.push([operation.data[2], operation.data[3]]);
        points.push([operation.data[4], operation.data[5]]);
      }
    } else if (operation.op === "lineTo") {
      if (odd) {
        points.push([operation.data[0], operation.data[1]]);
      }
    }
  }
  if (points.length >= 4) {
    if (roundness === "sharp") {
      return isPointInPolygon(points, x, y);
    }
    const polygonPoints = pointsOnBezierCurves(points, 10, 5);
    return isPointInPolygon(polygonPoints, x, y);
  }
  return false;
};

const hitTestRoughShape = (
  drawable: Drawable,
  x: number,
  y: number,
  lineThreshold: number
) => {
  // read operations from first opSet
  const ops = getCurvePathOps(drawable);

  // set start position as (0,0) just in case
  // move operation does not exist (unlikely but it is worth safekeeping it)
  let currentP: Point = [0, 0];

  return ops.some(({ op, data }, idx) => {
    // There are only four operation types:
    // move, bcurveTo, lineTo, and curveTo
    if (op === "move") {
      // change starting point
      currentP = data as unknown as Point;
      // move operation does not draw anything; so, it always
      // returns false
    } else if (op === "bcurveTo") {
      // create points from bezier curve
      // bezier curve stores data as a flattened array of three positions
      // [x1, y1, x2, y2, x3, y3]
      const p1 = [data[0], data[1]] as Point;
      const p2 = [data[2], data[3]] as Point;
      const p3 = [data[4], data[5]] as Point;

      const p0 = currentP;
      currentP = p3;

      // check if points are on the curve
      // cubic bezier curves require four parameters
      // the first parameter is the last stored position (p0)
      const retVal = pointInBezierEquation(
        p0,
        p1,
        p2,
        p3,
        [x, y],
        lineThreshold
      );

      // set end point of bezier curve as the new starting point for
      // upcoming operations as each operation is based on the last drawn
      // position of the previous operation
      return retVal;
    } else if (op === "lineTo") {
      return hitTestCurveInside(drawable, x, y, "sharp");
    } else if (op === "qcurveTo") {
      // TODO: Implement this
      console.warn("qcurveTo is not implemented yet");
    }

    return false;
  });
};
