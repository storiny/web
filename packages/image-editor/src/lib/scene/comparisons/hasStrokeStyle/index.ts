import { LayerType } from "../../../../constants";

/**
 * Predicate function for determining whether a layer supports stroke style
 * @param type Layer type
 */
export const hasStrokeStyle = (type: LayerType): boolean =>
  type === LayerType.RECTANGLE ||
  type === LayerType.ELLIPSE ||
  type === LayerType.DIAMOND ||
  type === LayerType.ARROW ||
  type === LayerType.LINE;
