import { Mutable } from "@storiny/types";
import rough from "roughjs";
import { Drawable } from "roughjs/bin/core";

import { LayerType } from "../../../../constants";
import { Layer, LinearLayer, Point } from "../../../../types";
import { rotate } from "../../../math";
import { generateRoughOptions, getShapeForLayer } from "../../../renderer";
import { LinearLayerEditor } from "../../linearLayerEditor";
import { isFreeDrawLayer, isLinearLayer } from "../../predicates";
import { getBoundTextLayer } from "../../text";
import { getBoundsFromPoints } from "../getBoundsFromPoints";
import { getCurvePathOps } from "../getCurvePathOps";
import { getLayerAbsoluteCoords } from "../getLayerAbsoluteCoords";
import { getMinMaxXYFromCurvePathOps } from "../getMinMaxXYFromCurvePathOps";
import { Bounds } from "../types";

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
  const transformXY = (x: number, y: number): [number, number] =>
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
