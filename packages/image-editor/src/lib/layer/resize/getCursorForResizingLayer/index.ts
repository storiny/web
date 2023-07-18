import { Layer } from "../../../../types";
import { MaybeTransformHandleType } from "../../transformHandles";

const RESIZE_CURSORS = ["ns", "nesw", "ew", "nwse"];

/**
 * Rotates resize cursor by the specified angle
 * @param cursor Cursor
 * @param angle Angle to rotate by
 */
const rotateResizeCursor = (cursor: string, angle: number): string => {
  const index = RESIZE_CURSORS.indexOf(cursor);

  if (index >= 0) {
    const a = Math.round(angle / (Math.PI / 4));
    cursor = RESIZE_CURSORS[(index + a) % RESIZE_CURSORS.length];
  }

  return cursor;
};

/**
 * Returns bidirectional cursor for the layer being resized
 * @param resizingLayer Layer being resized
 */
export const getCursorForResizingLayer = (resizingLayer: {
  layer?: Layer;
  transformHandleType: MaybeTransformHandleType;
}): string => {
  const { layer, transformHandleType } = resizingLayer;
  const shouldSwapCursors =
    layer && Math.sign(layer.height) * Math.sign(layer.width) === -1;
  let cursor = null;

  switch (transformHandleType) {
    case "n":
    case "s":
      cursor = "ns";
      break;
    case "w":
    case "e":
      cursor = "ew";
      break;
    case "nw":
    case "se":
      if (shouldSwapCursors) {
        cursor = "nesw";
      } else {
        cursor = "nwse";
      }
      break;
    case "ne":
    case "sw":
      if (shouldSwapCursors) {
        cursor = "nwse";
      } else {
        cursor = "nesw";
      }
      break;
    case "rotation":
      return "grab";
  }

  if (cursor && layer) {
    cursor = rotateResizeCursor(cursor, layer.angle);
  }

  return cursor ? `${cursor}-resize` : "";
};
