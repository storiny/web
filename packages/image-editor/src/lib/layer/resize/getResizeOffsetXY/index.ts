import { NonDeletedLayer } from "../../../../types";
import { rotate } from "../../../math";
import { getCommonBounds, getLayerAbsoluteCoords } from "../../bounds";
import { MaybeTransformHandleType } from "../../transformHandles";

/**
 * Returns the X and Y resize offset
 * @param transformHandleType Transform handle type
 * @param selectedLayers Selected layers
 * @param x X value
 * @param y Y value
 */
export const getResizeOffsetXY = (
  transformHandleType: MaybeTransformHandleType,
  selectedLayers: NonDeletedLayer[],
  x: number,
  y: number
): [number, number] => {
  const [x1, y1, x2, y2] =
    selectedLayers.length === 1
      ? getLayerAbsoluteCoords(selectedLayers[0])
      : getCommonBounds(selectedLayers);
  const cx = (x1 + x2) / 2;
  const cy = (y1 + y2) / 2;
  const angle = selectedLayers.length === 1 ? selectedLayers[0].angle : 0;

  [x, y] = rotate(x, y, cx, cy, -angle);

  switch (transformHandleType) {
    case "n":
      return rotate(x - (x1 + x2) / 2, y - y1, 0, 0, angle);
    case "s":
      return rotate(x - (x1 + x2) / 2, y - y2, 0, 0, angle);
    case "w":
      return rotate(x - x1, y - (y1 + y2) / 2, 0, 0, angle);
    case "e":
      return rotate(x - x2, y - (y1 + y2) / 2, 0, 0, angle);
    case "nw":
      return rotate(x - x1, y - y1, 0, 0, angle);
    case "ne":
      return rotate(x - x2, y - y1, 0, 0, angle);
    case "sw":
      return rotate(x - x1, y - y2, 0, 0, angle);
    case "se":
      return rotate(x - x2, y - y2, 0, 0, angle);
    default:
      return [0, 0];
  }
};
