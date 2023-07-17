import { LayerType } from "../../../../constants";

/**
 * Predicate function for determining whether a layer supports stroke width
 * @param type Layer type
 */
export const hasStrokeWidth = (type: LayerType): boolean =>
  type === LayerType.RECTANGLE ||
  type === LayerType.ELLIPSE ||
  type === LayerType.DIAMOND ||
  type === LayerType.FREE_DRAW ||
  type === LayerType.ARROW ||
  type === LayerType.LINE;
