import {
  FreeDrawLayer,
  Layer,
  TextLayerWithContainer
} from "../../../../types";
import { LinearLayerEditor } from "../../linearLayerEditor";
import {
  isArrowLayer,
  isFreeDrawLayer,
  isLinearLayer,
  isTextLayer
} from "../../predicates";
import { getContainerLayer } from "../../text";
import { getBoundsFromPoints } from "../getBoundsFromPoints";

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
