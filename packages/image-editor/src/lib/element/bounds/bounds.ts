import { Mutable } from "@storiny/types";
import { Drawable, Op } from "roughjs/bin/core";
import { RoughGenerator } from "roughjs/bin/generator";
import rough from "roughjs/bin/rough";

import { Arrowhead, LayerType } from "../../../constants";
import {
  FreeDrawLayer,
  Layer,
  LinearLayer,
  NonDeleted,
  Point,
  TextLayerWithContainer
} from "../../../types";
import { generateRoughOptions, getShapeForLayer } from "../../renderer";
import { LinearLayerEditor } from "../LinearLayerEditor";
import { distance2d, rotate, rotatePoint } from "../math";
import { rescalePoints } from "../points";
import {
  isArrowLayer,
  isFreeDrawLayer,
  isLinearLayer,
  isTextLayer
} from "../predicates";
import { getBoundTextLayer, getContainerLayer } from "../textLayer";

export interface RectangleBox {
  angle: number;
  height: number;
  width: number;
  x: number;
  y: number;
}

export interface BoundingBox {
  height: number;
  maxX: number;
  maxY: number;
  midX: number;
  midY: number;
  minX: number;
  minY: number;
  width: number;
}

type MaybeQuadraticSolution = [number | null, number | null] | false;

// x and y position of the top left corner, x and y position of the bottom right corner
export type Bounds = readonly [x1: number, y1: number, x2: number, y2: number];

export class LayerBounds {
  private static boundsCache = new WeakMap<
    Layer,
    {
      bounds: Bounds;
    }
  >();

  /**
   * Returns the layer bounds
   * @param layer Layer to find bounds
   */
  static getBounds(layer: Layer): Bounds {
    const cachedBounds = LayerBounds.boundsCache.get(layer);

    if (cachedBounds) {
      return cachedBounds.bounds;
    }

    const bounds = LayerBounds.calculateBounds(layer);

    LayerBounds.boundsCache.set(layer, {
      bounds
    });

    return bounds;
  }

  /**
   * Computes layer bounds
   * @param layer Layer
   * @private
   */
  private static calculateBounds(layer: Layer): Bounds {
    let bounds: [number, number, number, number];
    const [x1, y1, x2, y2, cx, cy] = getLayerAbsoluteCoords(layer);

    if (isFreeDrawLayer(layer)) {
      const [minX, minY, maxX, maxY] = getBoundsFromPoints(
        layer.points.map(([x, y]) =>
          rotate(x, y, cx - layer.x, cy - layer.y, layer.angle)
        )
      );

      return [minX + layer.x, minY + layer.y, maxX + layer.x, maxY + layer.y];
    } else if (isLinearLayer(layer)) {
      bounds = getLinearLayerRotatedBounds(layer, cx, cy);
    } else if (layer.type === LayerType.DIAMOND) {
      const [x11, y11] = rotate(cx, y1, cx, cy, layer.angle);
      const [x12, y12] = rotate(cx, y2, cx, cy, layer.angle);
      const [x22, y22] = rotate(x1, cy, cx, cy, layer.angle);
      const [x21, y21] = rotate(x2, cy, cx, cy, layer.angle);
      const minX = Math.min(x11, x12, x22, x21);
      const minY = Math.min(y11, y12, y22, y21);
      const maxX = Math.max(x11, x12, x22, x21);
      const maxY = Math.max(y11, y12, y22, y21);

      bounds = [minX, minY, maxX, maxY];
    } else if (layer.type === LayerType.ELLIPSE) {
      const w = (x2 - x1) / 2;
      const h = (y2 - y1) / 2;
      const cos = Math.cos(layer.angle);
      const sin = Math.sin(layer.angle);
      const ww = Math.hypot(w * cos, h * sin);
      const hh = Math.hypot(h * cos, w * sin);

      bounds = [cx - ww, cy - hh, cx + ww, cy + hh];
    } else {
      const [x11, y11] = rotate(x1, y1, cx, cy, layer.angle);
      const [x12, y12] = rotate(x1, y2, cx, cy, layer.angle);
      const [x22, y22] = rotate(x2, y2, cx, cy, layer.angle);
      const [x21, y21] = rotate(x2, y1, cx, cy, layer.angle);
      const minX = Math.min(x11, x12, x22, x21);
      const minY = Math.min(y11, y12, y22, y21);
      const maxX = Math.max(x11, x12, x22, x21);
      const maxY = Math.max(y11, y12, y22, y21);

      bounds = [minX, minY, maxX, maxY];
    }

    return bounds;
  }
}

/**
 * Returns the absolute layer coordinates. If the layer is created from right to
 * left, the width is going to be negative.
 * @param layer Layer
 * @param includeBoundText Whether to include bound text
 */
export const getLayerAbsoluteCoords = (
  layer: Layer,
  includeBoundText: boolean = false
): [number, number, number, number, number, number] => {
  if (isFreeDrawLayer(layer)) {
    return getFreeDrawLayerAbsoluteCoords(layer);
  } else if (isLinearLayer(layer)) {
    return LinearLayerEditor.getLayerAbsoluteCoords(layer, includeBoundText);
  } else if (isTextLayer(layer)) {
    const container = getContainerLayer(layer);
    if (isArrowLayer(container)) {
      const coords = LinearLayerEditor.getBoundTextLayerPosition(
        container,
        layer as TextLayerWithContainer
      );

      return [
        coords.x,
        coords.y,
        coords.x + layer.width,
        coords.y + layer.height,
        coords.x + layer.width / 2,
        coords.y + layer.height / 2
      ];
    }
  }

  return [
    layer.x,
    layer.y,
    layer.x + layer.width,
    layer.y + layer.height,
    layer.x + layer.width / 2,
    layer.y + layer.height / 2
  ];
};

/**
 * Returns the line segments that can be used for visual collision
 * detection as opposed to bounding box collision detection
 * @param layer Layer
 */
export const getLayerLineSegments = (layer: Layer): [Point, Point][] => {
  const [x1, y1, x2, y2, cx, cy] = getLayerAbsoluteCoords(layer);
  const center: Point = [cx, cy];

  if (isLinearLayer(layer) || isFreeDrawLayer(layer)) {
    const segments: [Point, Point][] = [];
    let i = 0;

    while (i < layer.points.length - 1) {
      segments.push([
        rotatePoint(
          [layer.points[i][0] + layer.x, layer.points[i][1] + layer.y] as Point,
          center,
          layer.angle
        ),
        rotatePoint(
          [
            layer.points[i + 1][0] + layer.x,
            layer.points[i + 1][1] + layer.y
          ] as Point,
          center,
          layer.angle
        )
      ]);

      i++;
    }

    return segments;
  }

  const [nw, ne, sw, se, n, s, w, e] = (
    [
      [x1, y1],
      [x2, y1],
      [x1, y2],
      [x2, y2],
      [cx, y1],
      [cx, y2],
      [x1, cy],
      [x2, cy]
    ] as Point[]
  ).map((point) => rotatePoint(point, center, layer.angle));

  if (layer.type === LayerType.DIAMOND) {
    return [
      [n, w],
      [n, e],
      [s, w],
      [s, e]
    ];
  }

  if (layer.type === LayerType.ELLIPSE) {
    return [
      [n, w],
      [n, e],
      [s, w],
      [s, e],
      [n, w],
      [n, e],
      [s, w],
      [s, e]
    ];
  }

  return [
    [nw, ne],
    [sw, se],
    [nw, sw],
    [ne, se],
    [nw, e],
    [sw, e],
    [ne, w],
    [se, w]
  ];
};

/**
 * Returns the absolute coordinates of rectangle box
 * @param boxSceneCoords
 */
export const getRectangleBoxAbsoluteCoords = (
  boxSceneCoords: RectangleBox
): [number, number, number, number, number, number] => [
  boxSceneCoords.x,
  boxSceneCoords.y,
  boxSceneCoords.x + boxSceneCoords.width,
  boxSceneCoords.y + boxSceneCoords.height,
  boxSceneCoords.x + boxSceneCoords.width / 2,
  boxSceneCoords.y + boxSceneCoords.height / 2
];

/**
 * Returns the relative position of a point with respect to the layer using it's
 * absolute coordinates
 * @param layer Layer
 * @param absoluteCoords Absolute point coordinates
 */
export const pointRelativeTo = (layer: Layer, absoluteCoords: Point): Point => [
  absoluteCoords[0] - layer.x,
  absoluteCoords[1] - layer.y
];

/**
 * Returns diamond points
 * @param layer Layer
 */
export const getDiamondPoints = (
  layer: Layer
): [number, number, number, number, number, number, number, number] => {
  // We add +1 to avoid these numbers to be 0
  // otherwise rough.js will throw an error complaining about it
  const topX = Math.floor(layer.width / 2) + 1;
  const topY = 0;
  const rightX = layer.width;
  const rightY = Math.floor(layer.height / 2) + 1;
  const bottomX = topX;
  const bottomY = layer.height;
  const leftX = 0;

  return [topX, topY, rightX, rightY, bottomX, bottomY, leftX, rightY];
};

/**
 * Returns the curve path ops
 * @param shape Shape
 */
export const getCurvePathOps = (shape: Drawable): Op[] => {
  for (const set of shape.sets) {
    if (set.type === "path") {
      return set.ops;
    }
  }

  return shape.sets[0].ops;
};

/**
 * Computes the bezier value
 * @see https://eliot-jones.com/2019/12/cubic-bezier-curve-bounding-boxes
 * @param t
 * @param p0
 * @param p1
 * @param p2
 * @param p3
 */
const getBezierValueForT = (
  t: number,
  p0: number,
  p1: number,
  p2: number,
  p3: number
): number => {
  const oneMinusT = 1 - t;
  return (
    Math.pow(oneMinusT, 3) * p0 +
    3 * Math.pow(oneMinusT, 2) * t * p1 +
    3 * oneMinusT * Math.pow(t, 2) * p2 +
    Math.pow(t, 3) * p3
  );
};

/**
 * Tries to compute the result of a quadratic equation
 * @param p0
 * @param p1
 * @param p2
 * @param p3
 */
const solveQuadratic = (
  p0: number,
  p1: number,
  p2: number,
  p3: number
): MaybeQuadraticSolution => {
  const i = p1 - p0;
  const j = p2 - p1;
  const k = p3 - p2;
  const a = 3 * i - 6 * j + 3 * k;
  const b = 6 * j - 6 * i;
  const c = 3 * i;
  const sqrtPart = b * b - 4 * a * c;
  const hasSolution = sqrtPart >= 0;

  if (!hasSolution) {
    return false;
  }

  let s1 = null;
  let s2 = null;

  let t1: number;
  let t2: number;

  if (a === 0) {
    t1 = t2 = -c / b;
  } else {
    t1 = (-b + Math.sqrt(sqrtPart)) / (2 * a);
    t2 = (-b - Math.sqrt(sqrtPart)) / (2 * a);
  }

  if (t1 >= 0 && t1 <= 1) {
    s1 = getBezierValueForT(t1, p0, p1, p2, p3);
  }

  if (t2 >= 0 && t2 <= 1) {
    s2 = getBezierValueForT(t2, p0, p1, p2, p3);
  }

  return [s1, s2];
};

/**
 * Returns the cubic bézier curve bound
 * @param p0
 * @param p1
 * @param p2
 * @param p3
 */
const getCubicBezierCurveBound = (
  p0: Point,
  p1: Point,
  p2: Point,
  p3: Point
): Bounds => {
  const solX = solveQuadratic(p0[0], p1[0], p2[0], p3[0]);
  const solY = solveQuadratic(p0[1], p1[1], p2[1], p3[1]);
  let minX = Math.min(p0[0], p3[0]);
  let maxX = Math.max(p0[0], p3[0]);

  if (solX) {
    const xs = solX.filter((x) => x !== null) as number[];
    minX = Math.min(minX, ...xs);
    maxX = Math.max(maxX, ...xs);
  }

  let minY = Math.min(p0[1], p3[1]);
  let maxY = Math.max(p0[1], p3[1]);

  if (solY) {
    const ys = solY.filter((y) => y !== null) as number[];
    minY = Math.min(minY, ...ys);
    maxY = Math.max(maxY, ...ys);
  }

  return [minX, minY, maxX, maxY];
};

/**
 * Returns the minimum and maximum X and Y coordinate values from curve path ops
 * @param ops Ops
 * @param transformXY Transformation
 */
export const getMinMaxXYFromCurvePathOps = (
  ops: Op[],
  transformXY?: (x: number, y: number) => [number, number]
): [number, number, number, number] => {
  let currentP: Point = [0, 0];

  const { minX, minY, maxX, maxY } = ops.reduce(
    (limits, { op, data }) => {
      // There are only four operation types:
      // move, bcurveTo, lineTo, and curveTo
      if (op === "move") {
        // Change starting point
        currentP = data as unknown as Point;
        // Move operation does not draw anything; so, it always
        // returns false
      } else if (op === "bcurveTo") {
        const _p1 = [data[0], data[1]] as Point;
        const _p2 = [data[2], data[3]] as Point;
        const _p3 = [data[4], data[5]] as Point;

        const p1 = transformXY ? transformXY(..._p1) : _p1;
        const p2 = transformXY ? transformXY(..._p2) : _p2;
        const p3 = transformXY ? transformXY(..._p3) : _p3;

        const p0 = transformXY ? transformXY(...currentP) : currentP;
        currentP = _p3;

        const [minX, minY, maxX, maxY] = getCubicBezierCurveBound(
          p0,
          p1,
          p2,
          p3
        );

        limits.minX = Math.min(limits.minX, minX);
        limits.minY = Math.min(limits.minY, minY);

        limits.maxX = Math.max(limits.maxX, maxX);
        limits.maxY = Math.max(limits.maxY, maxY);
      } else if (op === "lineTo") {
        // TODO: Implement this
      } else if (op === "qcurveTo") {
        // TODO: Implement this
      }
      return limits;
    },
    { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity }
  );

  return [minX, minY, maxX, maxY];
};

/**
 * Returns the bounds from points
 * @param points Free draw layer
 */
const getBoundsFromPoints = (
  points: FreeDrawLayer["points"]
): [number, number, number, number] => {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const [x, y] of points) {
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }

  return [minX, minY, maxX, maxY];
};

/**
 * Returns the absolute coordinates of a free draw layer
 * @param layer Free draw layer
 */
const getFreeDrawLayerAbsoluteCoords = (
  layer: FreeDrawLayer
): [number, number, number, number, number, number] => {
  const [minX, minY, maxX, maxY] = getBoundsFromPoints(layer.points);
  const x1 = minX + layer.x;
  const y1 = minY + layer.y;
  const x2 = maxX + layer.x;
  const y2 = maxY + layer.y;

  return [x1, y1, x2, y2, (x1 + x2) / 2, (y1 + y2) / 2];
};

/**
 * Returns the arrowhead points
 * @param layer Linear layer
 * @param shape Shape
 * @param position Position
 * @param arrowhead Arrowhead type
 */
export const getArrowheadPoints = (
  layer: LinearLayer,
  shape: Drawable[],
  position: "start" | "end",
  arrowhead: Arrowhead
): null | [number, number, number] => {
  const ops = getCurvePathOps(shape[0]);

  if (ops.length < 1) {
    return null;
  }

  // The index of the bCurve operation to examine.
  const index = position === "start" ? 1 : ops.length - 1;
  const data = ops[index].data;
  const p3 = [data[4], data[5]] as Point;
  const p2 = [data[2], data[3]] as Point;
  const p1 = [data[0], data[1]] as Point;

  // We need to find p0 of the bézier curve.
  // It is typically the last point of the previous
  // curve; it can also be the position of moveTo operation.
  const prevOp = ops[index - 1];
  let p0: Point = [0, 0];

  if (prevOp.op === "move") {
    p0 = prevOp.data as unknown as Point;
  } else if (prevOp.op === "bcurveTo") {
    p0 = [prevOp.data[4], prevOp.data[5]];
  }

  // B(t) = p0 * (1-t)^3 + 3p1 * t * (1-t)^2 + 3p2 * t^2 * (1-t) + p3 * t^3
  const equation = (t: number, idx: number): number =>
    Math.pow(1 - t, 3) * p3[idx] +
    3 * t * Math.pow(1 - t, 2) * p2[idx] +
    3 * Math.pow(t, 2) * (1 - t) * p1[idx] +
    p0[idx] * Math.pow(t, 3);

  // We know the last point of the arrow (or the first, if start arrowhead)
  const [x2, y2] = position === "start" ? p0 : p3;

  // By using cubic bezier equation (B(t)) and the given parameters,
  // we calculate a point that is closer to the last point.
  // The value 0.3 is chosen arbitrarily, and it works best for all
  // the tested cases
  const [x1, y1] = [equation(0.3, 0), equation(0.3, 1)];

  // Find the normalized direction vector based on the
  // previously calculated points.
  const distance = Math.hypot(x2 - x1, y2 - y1);
  const nx = (x2 - x1) / distance;
  const ny = (y2 - y1) / distance;

  const size = {
    [Arrowhead.ARROW]: 30,
    [Arrowhead.BAR]: 15,
    [Arrowhead.DOT]: 15,
    [Arrowhead.TRIANGLE]: 15
  }[arrowhead]; // pixels (will differ for each arrowhead)

  let length = 0;

  if (arrowhead === Arrowhead.ARROW) {
    // Length for arrows is based on the length of the last section
    const [cx, cy] = layer.points[layer.points.length - 1];
    const [px, py] =
      layer.points.length > 1 ? layer.points[layer.points.length - 2] : [0, 0];

    length = Math.hypot(cx - px, cy - py);
  } else {
    // Length for other arrowhead types is based on the total length of the line
    for (let i = 0; i < layer.points.length; i++) {
      const [px, py] = layer.points[i - 1] || [0, 0];
      const [cx, cy] = layer.points[i];
      length += Math.hypot(cx - px, cy - py);
    }
  }

  // Scale down the arrowhead until we hit a certain size so that it doesn't look weird
  // This value is selected by minimizing a minimum size with the last segment of the arrowhead
  const minSize = Math.min(size, length / 2);
  const xs = x2 - nx * minSize;
  const ys = y2 - ny * minSize;

  if (arrowhead === Arrowhead.DOT) {
    const r = Math.hypot(ys - y2, xs - x2) + layer.strokeWidth;
    return [x2, y2, r];
  }

  const angle = {
    [Arrowhead.ARROW]: 20,
    [Arrowhead.BAR]: 90,
    [Arrowhead.TRIANGLE]: 25
  }[arrowhead]; // degrees

  // Return points
  const [x3, y3] = rotate(xs, ys, x2, y2, (-angle * Math.PI) / 180);
  const [x4, y4] = rotate(xs, ys, x2, y2, (angle * Math.PI) / 180);

  return [x2, y2, x3, y3, x4, y4];
};

/**
 * Generates a linear layer shape
 * @param layer Linear layer
 */
const generateLinearLayerShape = (layer: LinearLayer): Drawable => {
  const generator = rough.generator();
  const options = generateRoughOptions(layer);

  const method = ((): keyof typeof generator => {
    if (layer.roundness) {
      return "curve";
    }

    if (options.fill) {
      return "polygon";
    }

    return "linearPath";
  })();

  return (
    generator[method] as
      | typeof generator.curve
      | typeof generator.polygon
      | typeof generator.linearPath
  )(layer.points as Mutable<Point>[], options);
};

/**
 * Returns the rotation bounds for a linear layer
 * @param layer Layer
 * @param cx CX
 * @param cy CY
 */
const getLinearLayerRotatedBounds = (
  layer: LinearLayer,
  cx: number,
  cy: number
): [number, number, number, number] => {
  if (layer.points.length < 2) {
    const [pointX, pointY] = layer.points[0];
    const [x, y] = rotate(
      layer.x + pointX,
      layer.y + pointY,
      cx,
      cy,
      layer.angle
    );

    let coords: [number, number, number, number] = [x, y, x, y];
    const boundTextLayer = getBoundTextLayer(layer);

    if (boundTextLayer) {
      const coordsWithBoundText = LinearLayerEditor.getMinMaxXYWithBoundText(
        layer,
        [x, y, x, y],
        boundTextLayer
      );
      coords = [
        coordsWithBoundText[0],
        coordsWithBoundText[1],
        coordsWithBoundText[2],
        coordsWithBoundText[3]
      ];
    }

    return coords;
  }

  // The first layer is always the curve
  const cachedShape = getShapeForLayer(layer)?.[0];
  const shape = cachedShape ?? generateLinearLayerShape(layer);
  const ops = getCurvePathOps(shape);
  const transformXY = (x: number, y: number) =>
    rotate(layer.x + x, layer.y + y, cx, cy, layer.angle);
  const res = getMinMaxXYFromCurvePathOps(ops, transformXY);
  let coords: [number, number, number, number] = [
    res[0],
    res[1],
    res[2],
    res[3]
  ];
  const boundTextLayer = getBoundTextLayer(layer);

  if (boundTextLayer) {
    const coordsWithBoundText = LinearLayerEditor.getMinMaxXYWithBoundText(
      layer,
      coords,
      boundTextLayer
    );
    coords = [
      coordsWithBoundText[0],
      coordsWithBoundText[1],
      coordsWithBoundText[2],
      coordsWithBoundText[3]
    ];
  }

  return coords;
};

/**
 * Returns the layer bounds
 * @param layer Layer
 */
export const getLayerBounds = (layer: Layer): Bounds =>
  LayerBounds.getBounds(layer);

/**
 * Returns the bounds common to the specified layers
 * @param layers Layers
 */
export const getCommonBounds = (layers: readonly Layer[]): Bounds => {
  if (!layers.length) {
    return [0, 0, 0, 0];
  }

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  layers.forEach((layer) => {
    const [x1, y1, x2, y2] = getLayerBounds(layer);
    minX = Math.min(minX, x1);
    minY = Math.min(minY, y1);
    maxX = Math.max(maxX, x2);
    maxY = Math.max(maxY, y2);
  });

  return [minX, minY, maxX, maxY];
};

/**
 * Returns the absolute layer coordinates after resizing
 * @param layer Layer
 * @param nextWidth New width
 * @param nextHeight New height
 * @param normalizePoints Whether to normalize layer points
 */
export const getResizedLayerAbsoluteCoords = (
  layer: Layer,
  nextWidth: number,
  nextHeight: number,
  normalizePoints: boolean
): [number, number, number, number] => {
  if (!(isLinearLayer(layer) || isFreeDrawLayer(layer))) {
    return [layer.x, layer.y, layer.x + nextWidth, layer.y + nextHeight];
  }

  const points = rescalePoints(
    0,
    nextWidth,
    rescalePoints(1, nextHeight, layer.points, normalizePoints),
    normalizePoints
  );

  let bounds: [number, number, number, number];

  if (isFreeDrawLayer(layer)) {
    // Free Draw
    bounds = getBoundsFromPoints(points);
  } else {
    // Line
    const gen = rough.generator();
    const curve = !layer.roundness
      ? gen.linearPath(
          points as [number, number][],
          generateRoughOptions(layer)
        )
      : gen.curve(points as [number, number][], generateRoughOptions(layer));

    const ops = getCurvePathOps(curve);
    bounds = getMinMaxXYFromCurvePathOps(ops);
  }

  const [minX, minY, maxX, maxY] = bounds;
  return [minX + layer.x, minY + layer.y, maxX + layer.x, maxY + layer.y];
};

/**
 * Returns the layer points coordinates
 * @param layer Layer
 * @param points Points for calculation
 */
export const getLayerPointsCoords = (
  layer: LinearLayer,
  points: readonly (readonly [number, number])[]
): [number, number, number, number] => {
  // This might be computationally heavy
  const gen = rough.generator();
  const curve =
    layer.roundness == null
      ? gen.linearPath(
          points as [number, number][],
          generateRoughOptions(layer)
        )
      : gen.curve(points as [number, number][], generateRoughOptions(layer));
  const ops = getCurvePathOps(curve);
  const [minX, minY, maxX, maxY] = getMinMaxXYFromCurvePathOps(ops);
  return [minX + layer.x, minY + layer.y, maxX + layer.x, maxY + layer.y];
};

/**
 * Returns the closest layer bounds from the specified coordinates
 * @param layers Layers
 * @param from Source point
 */
export const getClosestLayerBounds = (
  layers: readonly Layer[],
  from: { x: number; y: number }
): Bounds => {
  if (!layers.length) {
    return [0, 0, 0, 0];
  }

  let minDistance = Infinity;
  let closestLayer = layers[0];

  layers.forEach((layer) => {
    const [x1, y1, x2, y2] = getLayerBounds(layer);
    const distance = distance2d((x1 + x2) / 2, (y1 + y2) / 2, from.x, from.y);

    if (distance < minDistance) {
      minDistance = distance;
      closestLayer = layer;
    }
  });

  return getLayerBounds(closestLayer);
};

/**
 * Returns the common bounding box
 * @param layers Layers
 */
export const getCommonBoundingBox = (
  layers: Layer[] | readonly NonDeleted<Layer>[]
): BoundingBox => {
  const [minX, minY, maxX, maxY] = getCommonBounds(layers);
  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
    midX: (minX + maxX) / 2,
    midY: (minY + maxY) / 2
  };
};
