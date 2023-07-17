import { LayerType } from "../../../../constants";

/**
 * Predicate function for determining whether a layer type supports background
 * @param type Layer type
 */
export const hasBackground = (type: LayerType): boolean =>
  type === LayerType.RECTANGLE ||
  type === LayerType.ELLIPSE ||
  type === LayerType.DIAMOND ||
  type === LayerType.LINE ||
  type === LayerType.FREE_DRAW;
