import { PointerType } from "../../../../constants";
import { Zoom } from "../../../../types";
import {
  getTransformHandlesFromCoords,
  MaybeTransformHandleType,
  OMIT_SIDES_FOR_MULTIPLE_ELEMENTS,
  TransformHandleType
} from "../../transformHandles";
import { isInsideTransformHandle } from "../resizeTest";

/**
 * Returns the transform handle type from coordinates
 * @param x1 X1 value
 * @param y1 Y1 value
 * @param x2 X2 value
 * @param y2 Y2 value
 * @param scenePointerX Scene pointer X coordinate
 * @param scenePointerY Scene pointer Y coordinate
 * @param zoom Zoom value
 * @param pointerType Pointer type
 */
export const getTransformHandleTypeFromCoords = (
  [x1, y1, x2, y2]: readonly [number, number, number, number],
  scenePointerX: number,
  scenePointerY: number,
  zoom: Zoom,
  pointerType: PointerType
): MaybeTransformHandleType => {
  const transformHandles = getTransformHandlesFromCoords(
    [x1, y1, x2, y2, (x1 + x2) / 2, (y1 + y2) / 2],
    0,
    zoom,
    pointerType,
    OMIT_SIDES_FOR_MULTIPLE_ELEMENTS
  );

  const found = Object.keys(transformHandles).find((key) => {
    const transformHandle =
      transformHandles[key as Exclude<TransformHandleType, "rotation">]!;

    return (
      transformHandle &&
      isInsideTransformHandle(transformHandle, scenePointerX, scenePointerY)
    );
  });

  return (found || false) as MaybeTransformHandleType;
};
