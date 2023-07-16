import { SHIFT_LOCKING_ANGLE } from "../../../../constants/new";
import {
  NonDeleted,
  NonDeletedLayer,
  PointerDownState,
  TextLayer,
  TextLayerWithContainer
} from "../../../../types";
import { adjustXYWithRotation, rotate } from "../../../math";
import Scene from "../../../scene/Scene";
import { updateBoundLayers } from "../../binding";
import {
  getLayerAbsoluteCoords,
  getResizedLayerAbsoluteCoords
} from "../../bounds";
import { mutateLayer } from "../../mutate";
import { isArrowLayer, isTextLayer } from "../../predicates";
import {
  MaybeTransformHandleType,
  TransformHandleType
} from "../../transformHandles";
import { measureFontSizeFromWidth } from "../measureFontSizeFromWidth";
import { normalizeAngle } from "../normalizeAngle";
import { resizeMultipleLayers } from "../resizeMultipleLayers";
import { resizeSingleLayer } from "../resizeSingleLayer";

/**
 * Rotates multiple layers
 * @param pointerDownState Pointer down state
 * @param layers Layers
 * @param pointerX Pointer X position
 * @param pointerY Pointer Y position
 * @param shouldRotateWithDiscreteAngle Whether to rotate with discrete angle
 * @param centerX Center X coordinate
 * @param centerY Center Y coordinate
 */
const rotateMultipleLayers = (
  pointerDownState: PointerDownState,
  layers: readonly NonDeletedLayer[],
  pointerX: number,
  pointerY: number,
  shouldRotateWithDiscreteAngle: boolean,
  centerX: number,
  centerY: number
): void => {
  let centerAngle =
    (5 * Math.PI) / 2 + Math.atan2(pointerY - centerY, pointerX - centerX);

  if (shouldRotateWithDiscreteAngle) {
    centerAngle += SHIFT_LOCKING_ANGLE / 2;
    centerAngle -= centerAngle % SHIFT_LOCKING_ANGLE;
  }

  layers.forEach((layer) => {
    const [x1, y1, x2, y2] = getLayerAbsoluteCoords(layer);
    const cx = (x1 + x2) / 2;
    const cy = (y1 + y2) / 2;
    const origAngle =
      pointerDownState.originalLayers.get(layer.id)?.angle ?? layer.angle;
    const [rotatedCX, rotatedCY] = rotate(
      cx,
      cy,
      centerX,
      centerY,
      centerAngle + origAngle - layer.angle
    );

    mutateLayer(
      layer,
      {
        x: layer.x + (rotatedCX - cx),
        y: layer.y + (rotatedCY - cy),
        angle: normalizeAngle(centerAngle + origAngle)
      },
      false
    );

    updateBoundLayers(layer, { simultaneouslyUpdated: layers });

    const boundText = getBoundTextLayer(layer);

    if (boundText && !isArrowLayer(layer)) {
      mutateLayer(
        boundText,
        {
          x: boundText.x + (rotatedCX - cx),
          y: boundText.y + (rotatedCY - cy),
          angle: normalizeAngle(centerAngle + origAngle)
        },
        false
      );
    }
  });

  Scene.getScene(layers[0])?.informMutation();
};

/**
 * Returns true when transform (resizing or rotation) happens
 * @param pointerDownState Pointer down state
 * @param transformHandleType Transform handle type
 * @param selectedLayers Selected layers
 * @param resizeArrowDirection Resize an arrow direction
 * @param shouldRotateWithDiscreteAngle Whether to rotate with discrete angle
 * @param shouldResizeFromCenter Whether to resize from center
 * @param shouldMaintainAspectRatio Whether to maintain aspect ratio
 * @param pointerX Pointer X position
 * @param pointerY Pointer Y position
 * @param centerX Center X position
 * @param centerY Center Y position
 */
export const transformLayers = (
  pointerDownState: PointerDownState,
  transformHandleType: MaybeTransformHandleType,
  selectedLayers: readonly NonDeletedLayer[],
  resizeArrowDirection: "origin" | "end",
  shouldRotateWithDiscreteAngle: boolean,
  shouldResizeFromCenter: boolean,
  shouldMaintainAspectRatio: boolean,
  pointerX: number,
  pointerY: number,
  centerX: number,
  centerY: number
): boolean => {
  if (selectedLayers.length === 1) {
    const [layer] = selectedLayers;

    if (transformHandleType === "rotation") {
      rotateSingleLayer(
        layer,
        pointerX,
        pointerY,
        shouldRotateWithDiscreteAngle
      );

      updateBoundLayers(layer);
    } else if (
      isTextLayer(layer) &&
      (transformHandleType === "nw" ||
        transformHandleType === "ne" ||
        transformHandleType === "sw" ||
        transformHandleType === "se")
    ) {
      resizeSingleTextLayer(
        layer,
        transformHandleType,
        shouldResizeFromCenter,
        pointerX,
        pointerY
      );

      updateBoundLayers(layer);
    } else if (transformHandleType) {
      resizeSingleLayer(
        pointerDownState.originalLayers,
        shouldMaintainAspectRatio,
        layer,
        transformHandleType,
        shouldResizeFromCenter,
        pointerX,
        pointerY
      );
    }

    return true;
  } else if (selectedLayers.length > 1) {
    if (transformHandleType === "rotation") {
      rotateMultipleLayers(
        pointerDownState,
        selectedLayers,
        pointerX,
        pointerY,
        shouldRotateWithDiscreteAngle,
        centerX,
        centerY
      );

      return true;
    } else if (
      transformHandleType === "nw" ||
      transformHandleType === "ne" ||
      transformHandleType === "sw" ||
      transformHandleType === "se"
    ) {
      resizeMultipleLayers(
        pointerDownState,
        selectedLayers,
        transformHandleType,
        shouldResizeFromCenter,
        pointerX,
        pointerY
      );

      return true;
    }
  }

  return false;
};

/**
 * Returns the sides for transform handle
 * @param transformHandleType Transform handle type
 * @param shouldResizeFromCenter Whether to resize from center
 */
const getSidesForTransformHandle = (
  transformHandleType: TransformHandleType,
  shouldResizeFromCenter: boolean
): { e: boolean; n: boolean; s: boolean; w: boolean } => ({
  n:
    /^(n|ne|nw)$/.test(transformHandleType) ||
    (shouldResizeFromCenter && /^(s|se|sw)$/.test(transformHandleType)),
  s:
    /^(s|se|sw)$/.test(transformHandleType) ||
    (shouldResizeFromCenter && /^(n|ne|nw)$/.test(transformHandleType)),
  w:
    /^(w|nw|sw)$/.test(transformHandleType) ||
    (shouldResizeFromCenter && /^(e|ne|se)$/.test(transformHandleType)),
  e:
    /^(e|ne|se)$/.test(transformHandleType) ||
    (shouldResizeFromCenter && /^(w|nw|sw)$/.test(transformHandleType))
});

/**
 * Rotates a single layer
 * @param layer Layer to rotate
 * @param pointerX Pointer X position
 * @param pointerY Pointer Y position
 * @param shouldRotateWithDiscreteAngle Whether to rotate with discrete angle
 */
const rotateSingleLayer = (
  layer: NonDeletedLayer,
  pointerX: number,
  pointerY: number,
  shouldRotateWithDiscreteAngle: boolean
): void => {
  const [x1, y1, x2, y2] = getLayerAbsoluteCoords(layer);
  const cx = (x1 + x2) / 2;
  const cy = (y1 + y2) / 2;
  let angle = (5 * Math.PI) / 2 + Math.atan2(pointerY - cy, pointerX - cx);

  if (shouldRotateWithDiscreteAngle) {
    angle += SHIFT_LOCKING_ANGLE / 2;
    angle -= angle % SHIFT_LOCKING_ANGLE;
  }

  angle = normalizeAngle(angle);

  const boundTextLayerId = getBoundTextLayerId(layer);
  mutateLayer(layer, { angle });

  if (boundTextLayerId) {
    const textLayer =
      Scene.getScene(layer)?.getLayer<TextLayerWithContainer>(boundTextLayerId);

    if (textLayer && !isArrowLayer(layer)) {
      mutateLayer(textLayer, { angle });
    }
  }
};

/**
 * Resizes a single text layer
 * @param layer Text layer
 * @param transformHandleType Transform handle type
 * @param shouldResizeFromCenter Whether to resize from center
 * @param pointerX Pointer X position
 * @param pointerY Pointer Y position
 */
const resizeSingleTextLayer = (
  layer: NonDeleted<TextLayer>,
  transformHandleType: "nw" | "ne" | "sw" | "se",
  shouldResizeFromCenter: boolean,
  pointerX: number,
  pointerY: number
): void => {
  const [x1, y1, x2, y2] = getLayerAbsoluteCoords(layer);
  const cx = (x1 + x2) / 2;
  const cy = (y1 + y2) / 2;

  // Rotation pointer with a reverse angle
  const [rotatedX, rotatedY] = rotate(pointerX, pointerY, cx, cy, -layer.angle);
  let scale: number;

  switch (transformHandleType) {
    case "se":
      scale = Math.max(
        (rotatedX - x1) / (x2 - x1),
        (rotatedY - y1) / (y2 - y1)
      );
      break;
    case "nw":
      scale = Math.max(
        (x2 - rotatedX) / (x2 - x1),
        (y2 - rotatedY) / (y2 - y1)
      );
      break;
    case "ne":
      scale = Math.max(
        (rotatedX - x1) / (x2 - x1),
        (y2 - rotatedY) / (y2 - y1)
      );
      break;
    case "sw":
      scale = Math.max(
        (x2 - rotatedX) / (x2 - x1),
        (rotatedY - y1) / (y2 - y1)
      );
      break;
  }

  if (scale > 0) {
    const nextWidth = layer.width * scale;
    const nextHeight = layer.height * scale;
    const metrics = measureFontSizeFromWidth(layer, nextWidth, nextHeight);

    if (metrics === null) {
      return;
    }

    const [nextX1, nextY1, nextX2, nextY2] = getResizedLayerAbsoluteCoords(
      layer,
      nextWidth,
      nextHeight,
      false
    );
    const deltaX1 = (x1 - nextX1) / 2;
    const deltaY1 = (y1 - nextY1) / 2;
    const deltaX2 = (x2 - nextX2) / 2;
    const deltaY2 = (y2 - nextY2) / 2;
    const [nextLayerX, nextLayerY] = adjustXYWithRotation(
      getSidesForTransformHandle(transformHandleType, shouldResizeFromCenter),
      layer.x,
      layer.y,
      layer.angle,
      deltaX1,
      deltaY1,
      deltaX2,
      deltaY2
    );

    mutateLayer(layer, {
      fontSize: metrics.size,
      width: nextWidth,
      height: nextHeight,
      baseline: metrics.baseline,
      x: nextLayerX,
      y: nextLayerY
    });
  }
};
