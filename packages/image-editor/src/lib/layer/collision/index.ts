/* eslint-disable no-case-declarations */

import { devConsole } from "@storiny/shared/src/utils/devLog";
import { Mutable } from "@storiny/types";
import { pointsOnBezierCurves } from "points-on-curve";
import { Drawable } from "roughjs/bin/core";

import { LayerType, StrokeRoundness } from "../../../constants";
import { isTransparent } from "../../../core/utils";
import {
  BindableLayer,
  DiamondLayer,
  EditorState,
  EllipseLayer,
  FreeDrawLayer,
  ImageLayer,
  Layer,
  LinearLayer,
  NonDeleted,
  NonDeletedLayer,
  Point,
  RectangleLayer,
  TextLayer
} from "../../../types";
import {
  distance2d,
  isPathALoop,
  isPointInPolygon,
  rotate,
  rotatePoint
} from "../../math";
import { getShapeForLayer } from "../../renderer";
import { getCurvePathOps, getLayerAbsoluteCoords } from "../bounds";
import * as GA from "../ga";
import * as GADirection from "../gadirections";
import * as GALine from "../galines";
import * as GAPoint from "../gapoints";
import * as GATransform from "../gatransforms";
import { hasBoundTextLayer, isImageLayer, isTextLayer } from "../predicates";

interface HitTestArgs {
  check: (distance: number, threshold: number) => boolean;
  layer: NonDeletedLayer;
  point: Point;
  threshold: number;
}

/**
 * Predicate function for determining whether a layer can be dragged from inside
 * @param layer Layer
 */
const isLayerDraggableFromInside = (layer: NonDeletedLayer): boolean => {
  if (layer.type === LayerType.ARROW) {
    return false;
  }

  if (layer.type === LayerType.FREE_DRAW) {
    return true;
  }

  const isDraggableFromInside =
    !isTransparent(layer.backgroundColor) || hasBoundTextLayer(layer);

  if (layer.type === LayerType.LINE) {
    return isDraggableFromInside && isPathALoop(layer.points);
  }

  return isDraggableFromInside || isImageLayer(layer);
};

// export const hitTest = (
//   layer: NonDeletedLayer,
//   editorState: EditorState,
//   frameNameBoundsCache: FrameNameBoundsCache,
//   x: number,
//   y: number
// ): boolean => {
//   // How many pixels off the shape boundary we still consider a hit
//   const threshold = 10 / appState.zoom.value;
//   const point: Point = [x, y];
//
//   if (
//     isLayerSelected(appState, layer) &&
//     shouldShowBoundingBox([layer], appState)
//   ) {
//     return isPointHittingLayerBoundingBox(
//       layer,
//       point,
//       threshold,
//       frameNameBoundsCache
//     );
//   }
//
//   const boundTextLayer = getBoundTextLayer(layer);
//   if (boundTextLayer) {
//     const isHittingBoundTextLayer = hitTest(
//       boundTextLayer,
//       appState,
//       frameNameBoundsCache,
//       x,
//       y
//     );
//     if (isHittingBoundTextLayer) {
//       return true;
//     }
//   }
//   return isHittingLayerNotConsideringBoundingBox(
//     layer,
//     appState,
//     frameNameBoundsCache,
//     point
//   );
// };

// export const isHittingLayerBoundingBoxWithoutHittingLayer = (
//   layer: NonDeletedExcalidrawLayer,
//   appState: AppState,
//   frameNameBoundsCache: FrameNameBoundsCache,
//   x: number,
//   y: number
// ): boolean => {
//   const threshold = 10 / appState.zoom.value;
//
//   // So that bound text layer hit is considered within bounding box of container even if its outside actual bounding box of layer
//   // eg for linear layers text can be outside the layer bounding box
//   const boundTextLayer = getBoundTextLayer(layer);
//   if (
//     boundTextLayer &&
//     hitTest(boundTextLayer, appState, frameNameBoundsCache, x, y)
//   ) {
//     return false;
//   }
//
//   return (
//     !isHittingLayerNotConsideringBoundingBox(
//       layer,
//       appState,
//       frameNameBoundsCache,
//       [x, y]
//     ) &&
//     isPointHittingLayerBoundingBox(
//       layer,
//       [x, y],
//       threshold,
//       frameNameBoundsCache
//     )
//   );
// };
//

export const isHittingLayerNotConsideringBoundingBox = (
  layer: NonDeletedLayer,
  editorState: EditorState,
  point: Point
): boolean => {
  const threshold = 10 / editorState.zoom.value;
  const check = isTextLayer(layer)
    ? isStrictlyInside
    : isLayerDraggableFromInside(layer)
    ? isInsideCheck
    : isNearCheck;

  return hitTestPointAgainstLayer({
    layer,
    point,
    threshold,
    check
  });
};

// const isLayerSelected = (
//   appState: AppState,
//   layer: NonDeleted<ExcalidrawLayer>
// ) => appState.selectedLayerIds[layer.id];

/**
 * Predicate function for checking if a point is hitting layer's bounding box
 * @param layer Layer
 * @param x Point X coordinate
 * @param y Point Y coordinate
 * @param threshold Threshold
 */
export const isPointHittingLayerBoundingBox = (
  layer: NonDeleted<Layer>,
  [x, y]: Point,
  threshold: number
): boolean => {
  const [x1, y1, x2, y2] = getLayerAbsoluteCoords(layer);
  const layerCenterX = (x1 + x2) / 2;
  const layerCenterY = (y1 + y2) / 2;
  // Reverse the rotation to take layer's angle into account
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

/**
 * Predicate function for checking border binding
 * @param layer Layer
 * @param x X coordinate
 * @param y Y coordinate
 */
export const bindingBorderTest = (
  layer: NonDeleted<BindableLayer>,
  { x, y }: { x: number; y: number }
): boolean => {
  const threshold = maxBindingGap(layer, layer.width, layer.height);
  const check = isOutsideCheck;
  const point: Point = [x, y];
  return hitTestPointAgainstLayer({
    layer,
    point,
    threshold,
    check
  });
};

/**
 * Computes the maximum binding gap
 * @param layer Layer
 * @param layerWidth Layer width
 * @param layerHeight Layer height
 */
export const maxBindingGap = (
  layer: Layer,
  layerWidth: number,
  layerHeight: number
): number => {
  // Aligns diamonds with rectangles
  const shapeRatio = layer.type === LayerType.DIAMOND ? 1 / Math.sqrt(2) : 1;
  const smallerDimension = shapeRatio * Math.min(layerWidth, layerHeight);
  // We make the bindable boundary bigger for bigger layers
  return Math.max(16, Math.min(0.25 * smallerDimension, 32));
};

/**
 * Predicate function for testing hit points against different layers
 * @param args Arguments
 */
const hitTestPointAgainstLayer = (args: HitTestArgs): boolean => {
  switch (args.layer.type) {
    case LayerType.RECTANGLE:
    case LayerType.IMAGE:
    case LayerType.TEXT:
    case LayerType.DIAMOND:
    case LayerType.ELLIPSE:
      const distance = distanceToBindableLayer(args.layer, args.point);
      return args.check(distance, args.threshold);
    case LayerType.FREE_DRAW: {
      if (
        !args.check(distanceToRectangle(args.layer, args.point), args.threshold)
      ) {
        return false;
      }

      return hitTestFreeDrawLayer(args.layer, args.point, args.threshold);
    }
    case LayerType.ARROW:
    case LayerType.LINE:
      return hitTestLinear(args);
    case LayerType.SELECTION:
      return false;
  }
};

/**
 * Computes the distance to a bindable layer
 * @param layer Bindable layer
 * @param point Source point
 */
export const distanceToBindableLayer = (
  layer: BindableLayer,
  point: Point
): number => {
  switch (layer.type) {
    case LayerType.RECTANGLE:
    case LayerType.IMAGE:
    case LayerType.TEXT:
    case LayerType.DIAMOND:
      return distanceToDiamond(layer as DiamondLayer, point);
    case LayerType.ELLIPSE:
      return distanceToEllipse(layer as EllipseLayer, point);
  }
};

/**
 * Predicate function for checking if the distance is less than zero
 * @param distance Distance
 */
const isStrictlyInside = (distance: number): boolean => distance < 0;

/**
 * Predicate function for checking if the distance value is inside the threshold
 * @param distance Distance
 * @param threshold Threshold
 */
const isInsideCheck = (distance: number, threshold: number): boolean =>
  distance < threshold;

/**
 * Predicate function for near check
 * @param distance Distance
 * @param threshold Threshold
 */
const isNearCheck = (distance: number, threshold: number): boolean =>
  Math.abs(distance) < threshold;

/**
 * Predicate function for checking if the disance value is outside the threshold
 * @param distance Distance
 * @param threshold Threshold
 */
const isOutsideCheck = (distance: number, threshold: number): boolean =>
  0 <= distance && distance < threshold;

/**
 * Computes the distance to rectangle layer
 * @param layer Rectangular layer
 * @param point Point for computation
 */
const distanceToRectangle = (
  layer: RectangleLayer | TextLayer | FreeDrawLayer | ImageLayer,
  point: Point
): number => {
  const [, pointRel, hwidth, hheight] = pointRelativeToLayer(layer, point);
  return Math.max(
    GAPoint.distanceToLine(pointRel, GALine.equation(0, 1, -hheight)),
    GAPoint.distanceToLine(pointRel, GALine.equation(1, 0, -hwidth))
  );
};

// const distanceToRectangleBox = (box: RectangleBox, point: Point): number => {
//   const [, pointRel, hwidth, hheight] = pointRelativeToDivLayer(point, box);
//   return Math.max(
//     GAPoint.distanceToLine(pointRel, GALine.equation(0, 1, -hheight)),
//     GAPoint.distanceToLine(pointRel, GALine.equation(1, 0, -hwidth))
//   );
// };

/**
 * Computes the distance to a diamond layer
 * @param layer Diamond layer
 * @param point Point for computation
 */
const distanceToDiamond = (layer: DiamondLayer, point: Point): number => {
  const [, pointRel, hwidth, hheight] = pointRelativeToLayer(layer, point);
  const side = GALine.equation(hheight, hwidth, -hheight * hwidth);
  return GAPoint.distanceToLine(pointRel, side);
};

/**
 * Computes the distance to an ellipse layer
 * @param layer Ellipse layer
 * @param point Point for computation
 */
const distanceToEllipse = (layer: EllipseLayer, point: Point): number => {
  const [pointRel, tangent] = ellipseParamsForTest(layer, point);
  return -GALine.sign(tangent) * GAPoint.distanceToLine(pointRel, tangent);
};

/**
 * Returns the hit test params for ellipse
 * @param layer Ellipse layer
 * @param point Point
 */
const ellipseParamsForTest = (
  layer: EllipseLayer,
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
  [0, 1, 2, 3].forEach((): void => {
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

/**
 * Predicate function for testing hit point for free draw layer
 * @param layer Free draw layer
 * @param point Point
 * @param threshold Threshold
 */
const hitTestFreeDrawLayer = (
  layer: FreeDrawLayer,
  point: Point,
  threshold: number
): boolean => {
  // Check point-distance-to-line-segment for every segment in the
  // layer's points (its input points, not its outline points)
  let x: number;
  let y: number;

  if (layer.angle === 0) {
    x = point[0] - layer.x;
    y = point[1] - layer.y;
  } else {
    // Counter-rotate the point around the center before testing
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

  // For filled freedraw shapes, support
  // selecting them from inside
  if (shape && shape.sets.length) {
    return hitTestRoughShape(shape, x, y, threshold);
  }

  return false;
};

/**
 * Predicate function for linear hit-point testing
 * @param args Arguments
 */
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
  const shape = getShapeForLayer(layer as LinearLayer);

  if (!shape) {
    return false;
  }

  if (args.check === isInsideCheck) {
    const hit = shape.some((subshape) =>
      hitTestCurveInside(
        subshape,
        relX,
        relY,
        layer.roundness ? StrokeRoundness.ROUND : StrokeRoundness.SHARP
      )
    );
    if (hit) {
      return true;
    }
  }

  // Hit test all "subshapes" of the linear layer
  return shape.some((subshape) =>
    hitTestRoughShape(subshape, relX, relY, threshold)
  );
};

/**
 * Returns the point relative to the layers (x, y) position
 *
 * Note that for linear layers, the (x, y) position is not in the
 * top right corner of their boundary.
 *
 * Rectangles, diamonds and ellipses are symmetrical over axes,
 * and other layers have a rectangular boundary,
 * so we only need to perform hit tests for the positive quadrant
 * @param layer Layer
 * @param pointTuple Point tuple
 */
const pointRelativeToLayer = (
  layer: Layer,
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

// const pointRelativeToDivLayer = (
//   pointTuple: Point,
//   rectangle: RectangleBox
// ): [GA.Point, GA.Point, number, number] => {
//   const point = GAPoint.from(pointTuple);
//   const [x1, y1, x2, y2] = getRectangleBoxAbsoluteCoords(rectangle);
//   const center = coordsCenter(x1, y1, x2, y2);
//   const rotate = GATransform.rotation(center, rectangle.angle);
//   const pointRotated = GATransform.apply(rotate, point);
//   const pointRelToCenter = GA.sub(pointRotated, GADirection.from(center));
//   const pointRelToCenterAbs = GAPoint.abs(pointRelToCenter);
//   const layerPos = GA.offset(rectangle.x, rectangle.y);
//   const pointRelToPos = GA.sub(pointRotated, layerPos);
//   const halfWidth = (x2 - x1) / 2;
//   const halfHeight = (y2 - y1) / 2;
//   return [pointRelToPos, pointRelToCenterAbs, halfWidth, halfHeight];
// };

/**
 * Returns point in absolute coordinates
 * @param layer Layer
 * @param point Point relative to the layer position
 */
export const pointInAbsoluteCoords = (layer: Layer, point: Point): Point => {
  const [x, y] = point;
  const [x1, y1, x2, y2] = getLayerAbsoluteCoords(layer);
  const cx = (x2 - x1) / 2;
  const cy = (y2 - y1) / 2;
  const [rotatedX, rotatedY] = rotate(x, y, cx, cy, layer.angle);
  return [layer.x + rotatedX, layer.y + rotatedY];
};

/**
 * Transformations to layer's center
 * @param layer Layer
 */
const relativizationToLayerCenter = (layer: Layer): GA.Transform => {
  const [x1, y1, x2, y2] = getLayerAbsoluteCoords(layer);
  const center = coordsCenter(x1, y1, x2, y2);
  // GA has angle orientation opposite to `rotate`
  const rotate = GATransform.rotation(center, layer.angle);
  const translate = GA.reverse(
    GATransform.translation(GADirection.from(center))
  );

  return GATransform.compose(rotate, translate);
};

/**
 * Returns the center point of the specified coordinates
 * @param x1 X1
 * @param y1 Y1
 * @param x2 X2
 * @param y2 Y2
 */
const coordsCenter = (
  x1: number,
  y1: number,
  x2: number,
  y2: number
): GA.Point => GA.point((x1 + x2) / 2, (y1 + y2) / 2);

/**
 * Returns the focus distance, the oriented ratio between the size of
 * the layer and the focus image of the layer on which all focus points lie,
 * so it's a number between -1 and 1
 * @param layer Lyaer
 * @param a Point on the line, in absolute coordinates
 * @param b Another point on the line, in absolute coordinates (close to the layer)
 */
export const determineFocusDistance = (
  layer: BindableLayer,
  a: Point,
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
    case LayerType.RECTANGLE:
    case LayerType.IMAGE:
    case LayerType.TEXT:
    case LayerType.DIAMOND:
      return mabs < nabs ? c / (nabs * hwidth) : c / (mabs * hheight);
    case LayerType.ELLIPSE:
      return c / (hwidth * Math.sqrt(n ** 2 + q ** 2 * m ** 2));
  }
};

/**
 * Determines focus point
 * @param layer Bindable layer
 * @param focus Relative distance from the center of layer of the returned `focusPoint`
 * @param adjacentPoint Adjacent point
 */
export const determineFocusPoint = (
  layer: BindableLayer,
  focus: number,
  adjacentPoint: Point
): Point => {
  if (focus === 0) {
    const [x1, y1, x2, y2] = getLayerAbsoluteCoords(layer);
    const center = coordsCenter(x1, y1, x2, y2);
    return GAPoint.toTuple(center);
  }

  const relateToCenter = relativizationToLayerCenter(layer);
  const adjacentPointRel = GATransform.apply(
    relateToCenter,
    GAPoint.from(adjacentPoint)
  );
  const reverseRelateToCenter = GA.reverse(relateToCenter);
  let point;

  switch (layer.type) {
    case LayerType.RECTANGLE:
    case LayerType.IMAGE:
    case LayerType.TEXT:
    case LayerType.DIAMOND:
    case LayerType.ELLIPSE:
      point = findFocusPointForEllipse(
        layer as EllipseLayer,
        focus,
        adjacentPointRel
      );
      break;
  }

  return GAPoint.toTuple(GATransform.apply(reverseRelateToCenter, point));
};

/**
 * Returns 2 or 0 intersection points between line going through `a` and `b` and
 * the `layer`, in ascending order of distance from `a`
 * @param layer Layer
 * @param a Point on the line, in absolute coordinates
 * @param b Another point on the line, in absolute coordinates
 * @param gap If given, the layer is inflated by this value
 */
export const intersectLayerWithLine = (
  layer: BindableLayer,
  a: Point,
  b: Point,
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

/**
 * Returns sorted layer line intersections
 * @param layer Bindable layer
 * @param line Line relative to layer center
 * @param nearPoint Near point relative to layer center
 * @param gap Gap value
 */
const getSortedLayerLineIntersections = (
  layer: BindableLayer,
  line: GA.Line,
  nearPoint: GA.Point,
  gap: number = 0
): GA.Point[] => {
  let intersections: GA.Point[];
  switch (layer.type) {
    case LayerType.RECTANGLE:
    case LayerType.IMAGE:
    case LayerType.TEXT:
    case LayerType.DIAMOND:
    case LayerType.ELLIPSE:
      intersections = getEllipseIntersections(layer as EllipseLayer, gap, line);
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

/**
 * Returns layer corners
 * @param layer Layer
 * @param scale Scale
 */
const getCorners = (
  layer: RectangleLayer | ImageLayer | DiamondLayer | TextLayer,
  scale: number = 1
): GA.Point[] => {
  const hx = (scale * layer.width) / 2;
  const hy = (scale * layer.height) / 2;

  switch (layer.type) {
    case LayerType.RECTANGLE:
    case LayerType.IMAGE:
    case LayerType.TEXT:
    case LayerType.DIAMOND:
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
// const intersectSegment = (
//   line: GA.Line,
//   segment: [GA.Point, GA.Point]
// ): GA.Point[] => {
//   const [a, b] = segment;
//   const aDist = GAPoint.distanceToLine(a, line);
//   const bDist = GAPoint.distanceToLine(b, line);
//   if (aDist * bDist >= 0) {
//     // The intersection is outside segment `(a, b)`
//     return [];
//   }
//   return [GAPoint.intersect(line, GALine.through(a, b))];
// };

// const offsetSegment = (
//   segment: [GA.Point, GA.Point],
//   distance: number
// ): [GA.Point, GA.Point] => {
//   const [a, b] = segment;
//   const offset = GATransform.translationOrthogonal(
//     GADirection.fromTo(a, b),
//     distance
//   );
//   return [GATransform.apply(offset, a), GATransform.apply(offset, b)];
// };

/**
 * Returns ellipse layer intersections
 * @param layer Ellipse layer
 * @param gap Gap value
 * @param line Line
 */
const getEllipseIntersections = (
  layer: EllipseLayer,
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

/**
 * Returns circle intersections
 * @param center Center point
 * @param radius Radius value
 * @param line Line
 */
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

/**
 * Returns the focus point for an ellipse layer
 *
 * The focus point is the tangent point of the "focus image" of the
 * `layer`, where the tangent goes through `point`
 * @param ellipse Ellipse layer
 * @param relativeDistance Relative size of the "focus image" of layer on which
 * the focus point lies, between -1 and 1 (not 0)
 * @param point Point for which we're trying to find the focus point, relative
 * to the ellipse center
 */
export const findFocusPointForEllipse = (
  ellipse: EllipseLayer,
  relativeDistance: number,
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
    // If zero {-0, 0}, fall back to a same-sign value in the similar range
    n = (Object.is(n, -0) ? -1 : 1) * 0.01;
  }

  const x = -(a ** 2 * m) / (n ** 2 * b ** 2 + m ** 2 * a ** 2);
  return GA.point(x, (-m * x - 1) / n);
};

/**
 * Finds the focus point for rectangular layers
 * @param layer Rectangular layer
 * @param relativeDistance Relative distance, for how far away should the focus point be relative
 * to the size of the layer. Sign determines orientation
 * @param point Point for which we're trying to find the focus point, relative to the
 * layer center
 */
export const findFocusPointForRectangulars = (
  layer: RectangleLayer | ImageLayer | DiamondLayer | TextLayer,
  relativeDistance: number,
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

/**
 * Predicate function for validating points in bezier equation
 * @param p0 Point
 * @param p1 Point
 * @param p2 Point
 * @param p3 Point
 * @param mx Point X
 * @param my Point Y
 * @param lineThreshold Line threshold
 */
const pointInBezierEquation = (
  p0: Point,
  p1: Point,
  p2: Point,
  p3: Point,
  [mx, my]: Point,
  lineThreshold: number
): boolean => {
  // B(t) = p0 * (1-t)^3 + 3p1 * t * (1-t)^2 + 3p2 * t^2 * (1-t) + p3 * t^3
  const equation = (t: number, idx: number): number =>
    Math.pow(1 - t, 3) * p3[idx] +
    3 * t * Math.pow(1 - t, 2) * p2[idx] +
    3 * Math.pow(t, 2) * (1 - t) * p1[idx] +
    p0[idx] * Math.pow(t, 3);

  // Go through t in increments of 0.01
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

/**
 * Predicate function for testing hit points inside curves
 * @param drawable Drawable
 * @param x X coordinate
 * @param y Y coordinate
 * @param roundness Stroke roundness
 */
const hitTestCurveInside = (
  drawable: Drawable,
  x: number,
  y: number,
  roundness: StrokeRoundness
): boolean => {
  const ops = getCurvePathOps(drawable);
  const points: Mutable<Point>[] = [];
  let odd = false; // Select one line out of double lines

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
    if (roundness === StrokeRoundness.SHARP) {
      return isPointInPolygon(points, x, y);
    }

    const polygonPoints = pointsOnBezierCurves(points, 10, 5);
    return isPointInPolygon(polygonPoints as Point[], x, y);
  }

  return false;
};

/**
 * Predicate function for testing hit points around rough shape
 * @param drawable Drawable
 * @param x X coordinate
 * @param y Y coordinate
 * @param lineThreshold Line threshold
 */
const hitTestRoughShape = (
  drawable: Drawable,
  x: number,
  y: number,
  lineThreshold: number
): boolean => {
  // Read operations from first opSet
  const ops = getCurvePathOps(drawable);

  // Set start position as (0,0) just in case move operation
  // does not exist (unlikely, but it is worth safekeeping it)
  let currentP: Point = [0, 0];

  return ops.some(({ op, data }) => {
    // There are only four operation types:
    // move, bcurveTo, lineTo, and curveTo
    if (op === "move") {
      // Change starting point
      currentP = data as unknown as Point;
      // Move operation does not draw anything; so, it always
      // returns `false`
    } else if (op === "bcurveTo") {
      // Create points from the bézier curve.
      // Bézier curve stores data as a flattened array of three positions
      // [x1, y1, x2, y2, x3, y3]
      const p1 = [data[0], data[1]] as Point;
      const p2 = [data[2], data[3]] as Point;
      const p3 = [data[4], data[5]] as Point;
      const p0 = currentP;
      currentP = p3;

      // Check if points are on the curve cubic
      // bézier curves require four parameters.
      // The first parameter is the last stored position (p0).
      // Also set end point of the bézier curve as the new starting point for
      // upcoming operations as each operation is based on the last drawn
      // position of the previous operation
      return pointInBezierEquation(p0, p1, p2, p3, [x, y], lineThreshold);
    } else if (op === "lineTo") {
      return hitTestCurveInside(drawable, x, y, StrokeRoundness.SHARP);
    } else if (op === "qcurveTo") {
      // TODO: Implement this
      devConsole.warn("qcurveTo is not implemented yet");
    }

    return false;
  });
};
