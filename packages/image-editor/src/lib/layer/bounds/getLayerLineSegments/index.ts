import { LayerType } from "../../../../constants";
import { Layer, Point } from "../../../../types";
import { rotatePoint } from "../../../math";
import { isFreeDrawLayer, isLinearLayer } from "../../predicates";
import { getLayerAbsoluteCoords } from "../getLayerAbsoluteCoords";

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
