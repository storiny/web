import { PointerType } from "../../../../constants";
import { EditorState, NonDeletedLayer, Zoom } from "../../../../types";
import {
  getTransformHandles,
  MaybeTransformHandleType,
  TransformHandle,
  TransformHandleType
} from "../../transformHandles";

/**
 * Predicate function for determining whether X and Y values are inside
 * the transform handle
 * @param transformHandle Transform handle
 * @param x X value
 * @param y Y value
 */
export const isInsideTransformHandle = (
  transformHandle: TransformHandle,
  x: number,
  y: number
): boolean =>
  x >= transformHandle[0] &&
  x <= transformHandle[0] + transformHandle[2] &&
  y >= transformHandle[1] &&
  y <= transformHandle[1] + transformHandle[3];

/**
 * Resize test util
 * @param layer Layer
 * @param editorState Editor state
 * @param x X value
 * @param y Y value
 * @param zoom Zoom value
 * @param pointerType Pointer type
 */
export const resizeTest = (
  layer: NonDeletedLayer,
  editorState: EditorState,
  x: number,
  y: number,
  zoom: Zoom,
  pointerType: PointerType
): MaybeTransformHandleType => {
  if (!editorState.selectedLayerIds[layer.id]) {
    return false;
  }

  const { rotation: rotationTransformHandle, ...transformHandles } =
    getTransformHandles(layer, zoom, pointerType);

  if (
    rotationTransformHandle &&
    isInsideTransformHandle(rotationTransformHandle, x, y)
  ) {
    return "rotation" as TransformHandleType;
  }

  const filter = Object.keys(transformHandles).filter((key) => {
    const transformHandle =
      transformHandles[key as Exclude<TransformHandleType, "rotation">]!;

    if (!transformHandle) {
      return false;
    }

    return isInsideTransformHandle(transformHandle, x, y);
  });

  if (filter.length > 0) {
    return filter[0] as TransformHandleType;
  }

  return false;
};
