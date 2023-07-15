import { LayerType } from "../../../../constants";

/**
 * Predicate function for determining valid canvas layers
 * @param layer Layer
 */
export const isCanvasLayer = (layer: any): boolean =>
  layer?.type === LayerType.TEXT ||
  layer?.type === LayerType.DIAMOND ||
  layer?.type === LayerType.RECTANGLE ||
  layer?.type === LayerType.ELLIPSE ||
  layer?.type === LayerType.ARROW ||
  layer?.type === LayerType.FREE_DRAW ||
  layer?.type === LayerType.LINE;
