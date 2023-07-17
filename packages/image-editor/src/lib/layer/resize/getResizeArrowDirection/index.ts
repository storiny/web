import { LinearLayer, NonDeleted } from "../../../../types";
import { MaybeTransformHandleType } from "../../transformHandles/transformHandles";

/**
 * Returns the resize arrow direction
 * @param transformHandleType Transform handle type
 * @param layer Linear layer
 */
export const getResizeArrowDirection = (
  transformHandleType: MaybeTransformHandleType,
  layer: NonDeleted<LinearLayer>
): "origin" | "end" => {
  const [, [px, py]] = layer.points;
  const isResizeEnd =
    (transformHandleType === "nw" && (px < 0 || py < 0)) ||
    (transformHandleType === "ne" && px >= 0) ||
    (transformHandleType === "sw" && px <= 0) ||
    (transformHandleType === "se" && (px > 0 || py > 0));
  return isResizeEnd ? "end" : "origin";
};
