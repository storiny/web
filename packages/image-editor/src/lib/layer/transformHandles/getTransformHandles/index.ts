import { LayerType, PointerType } from "../../../../constants";
import { Layer, Zoom } from "../../../../types";
import { DEFAULT_SPACING } from "../../../renderer";
import { getLayerAbsoluteCoords } from "../../bounds";
import { isLinearLayer, isTextLayer } from "../../predicates";
import {
  OMIT_SIDES_FOR_LINE_BACKSLASH,
  OMIT_SIDES_FOR_LINE_SLASH,
  OMIT_SIDES_FOR_TEXT_ELEMENT,
  TransformHandles,
  TransformHandleType
} from "../constants";
import { getTransformHandlesFromCoords } from "../getTransformHandlesFromCoords";

/**
 * Returns transform handles
 * @param layer Layer
 * @param zoom Zoom value
 * @param pointerType Pointer type
 */
export const getTransformHandles = (
  layer: Layer,
  zoom: Zoom,
  pointerType: PointerType = PointerType.MOUSE
): TransformHandles => {
  // When locked layer is selected (especially when we toggle lock
  // via keyboard), the locked layer is visually distinct, indicating
  // you can't move or resize
  if (layer.locked) {
    return {};
  }

  let omitSides: { [T in TransformHandleType]?: boolean } = {};

  if (layer.type === LayerType.FREE_DRAW || isLinearLayer(layer)) {
    if (layer.points.length === 2) {
      // Only check the last point because the starting point is always (0,0)
      const [, p1] = layer.points;

      if (p1[0] === 0 || p1[1] === 0) {
        omitSides = OMIT_SIDES_FOR_LINE_BACKSLASH;
      } else if (p1[0] > 0 && p1[1] < 0) {
        omitSides = OMIT_SIDES_FOR_LINE_SLASH;
      } else if (p1[0] > 0 && p1[1] > 0) {
        omitSides = OMIT_SIDES_FOR_LINE_BACKSLASH;
      } else if (p1[0] < 0 && p1[1] > 0) {
        omitSides = OMIT_SIDES_FOR_LINE_SLASH;
      } else if (p1[0] < 0 && p1[1] < 0) {
        omitSides = OMIT_SIDES_FOR_LINE_BACKSLASH;
      }
    }
  } else if (isTextLayer(layer)) {
    omitSides = OMIT_SIDES_FOR_TEXT_ELEMENT;
  }

  const dashedLineMargin = isLinearLayer(layer)
    ? DEFAULT_SPACING + 8
    : DEFAULT_SPACING;

  return getTransformHandlesFromCoords(
    getLayerAbsoluteCoords(layer, true),
    layer.angle,
    zoom,
    pointerType,
    omitSides,
    dashedLineMargin
  );
};
