import {
  adjustXYWithRotation,
  centerPoint,
  rotate,
  rotatePoint
} from "../../lib/math/math";
import Scene from "../../lib/scene/scene/Scene";
import { SHIFT_LOCKING_ANGLE } from "../constants";
import { rescalePoints } from "../points";
import { Point, PointerDownState } from "../types";
import type { Mutable } from "../utility-types";
import { getFontString } from "../utils";
import { updateBoundLayers } from "./binding";
import {
  getCommonBoundingBox,
  getCommonBounds,
  getLayerAbsoluteCoords,
  getLayerPointsCoords,
  getResizedLayerAbsoluteCoords
} from "./bounds";
import { LinearLayerEditor } from "./linearLayerEditor";
import { mutateLayer } from "./mutateLayer";
import {
  getApproxMinContainerHeight,
  getApproxMinContainerWidth,
  getBoundTextLayer,
  getBoundTextLayerId,
  getBoundTextMaxHeight,
  getBoundTextMaxWidth,
  getContainerLayer,
  handleBindTextResize,
  measureText
} from "./textLayer";
import {
  MaybeTransformHandleType,
  TransformHandleDirection,
  TransformHandleType
} from "./transformHandles";
import {
  isArrowLayer,
  isBoundToContainer,
  isFrameLayer,
  isFreeDrawLayer,
  isImageLayer,
  isLinearLayer,
  isTextLayer
} from "./typeChecks";
import {
  ExcalidrawImageLayer,
  ExcalidrawLayer,
  ExcalidrawLinearLayer,
  ExcalidrawTextLayer,
  ExcalidrawTextLayerWithContainer,
  NonDeleted,
  NonDeletedExcalidrawLayer
} from "./types";

export const normalizeAngle = (angle: number): number => {
  if (angle < 0) {
    return angle + 2 * Math.PI;
  }
  if (angle >= 2 * Math.PI) {
    return angle - 2 * Math.PI;
  }
  return angle;
};

// Returns true when transform (resizing/rotation) happened
export const transformLayers = (
  pointerDownState: PointerDownState,
  transformHandleType: MaybeTransformHandleType,
  selectedLayers: readonly NonDeletedExcalidrawLayer[],
  resizeArrowDirection: "origin" | "end",
  shouldRotateWithDiscreteAngle: boolean,
  shouldResizeFromCenter: boolean,
  shouldMaintainAspectRatio: boolean,
  pointerX: number,
  pointerY: number,
  centerX: number,
  centerY: number
) => {
  if (selectedLayers.length === 1) {
    const [layer] = selectedLayers;
    if (transformHandleType === "rotation") {
      rotateSingleLayer(
        layer,
        pointerX,
        pointerY,
        shouldRotateWithDiscreteAngle,
        pointerDownState.originalLayers
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

const rotateSingleLayer = (
  layer: NonDeletedExcalidrawLayer,
  pointerX: number,
  pointerY: number,
  shouldRotateWithDiscreteAngle: boolean,
  originalLayers: Map<string, NonDeleted<ExcalidrawLayer>>
) => {
  const [x1, y1, x2, y2] = getLayerAbsoluteCoords(layer);
  const cx = (x1 + x2) / 2;
  const cy = (y1 + y2) / 2;
  let angle: number;
  if (isFrameLayer(layer)) {
    angle = 0;
  } else {
    angle = (5 * Math.PI) / 2 + Math.atan2(pointerY - cy, pointerX - cx);
    if (shouldRotateWithDiscreteAngle) {
      angle += SHIFT_LOCKING_ANGLE / 2;
      angle -= angle % SHIFT_LOCKING_ANGLE;
    }
    angle = normalizeAngle(angle);
  }
  const boundTextLayerId = getBoundTextLayerId(layer);

  mutateLayer(layer, { angle });
  if (boundTextLayerId) {
    const textLayer =
      Scene.getScene(layer)?.getLayer<ExcalidrawTextLayerWithContainer>(
        boundTextLayerId
      );

    if (textLayer && !isArrowLayer(layer)) {
      mutateLayer(textLayer, { angle });
    }
  }
};

const rescalePointsInLayer = (
  layer: NonDeletedExcalidrawLayer,
  width: number,
  height: number,
  normalizePoints: boolean
) =>
  isLinearLayer(layer) || isFreeDrawLayer(layer)
    ? {
        points: rescalePoints(
          0,
          width,
          rescalePoints(1, height, layer.points, normalizePoints),
          normalizePoints
        )
      }
    : {};

const MIN_FONT_SIZE = 1;

const measureFontSizeFromWidth = (
  layer: NonDeleted<ExcalidrawTextLayer>,
  nextWidth: number,
  nextHeight: number
): { baseline: number; size: number } | null => {
  // We only use width to scale font on resize
  let width = layer.width;

  const hasContainer = isBoundToContainer(layer);
  if (hasContainer) {
    const container = getContainerLayer(layer);
    if (container) {
      width = getBoundTextMaxWidth(container);
    }
  }
  const nextFontSize = layer.fontSize * (nextWidth / width);
  if (nextFontSize < MIN_FONT_SIZE) {
    return null;
  }
  const metrics = measureText(
    layer.text,
    getFontString({ fontSize: nextFontSize, fontFamily: layer.fontFamily }),
    layer.lineHeight
  );
  return {
    size: nextFontSize,
    baseline: metrics.baseline + (nextHeight - metrics.height)
  };
};

const getSidesForTransformHandle = (
  transformHandleType: TransformHandleType,
  shouldResizeFromCenter: boolean
) => ({
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

const resizeSingleTextLayer = (
  layer: NonDeleted<ExcalidrawTextLayer>,
  transformHandleType: "nw" | "ne" | "sw" | "se",
  shouldResizeFromCenter: boolean,
  pointerX: number,
  pointerY: number
) => {
  const [x1, y1, x2, y2] = getLayerAbsoluteCoords(layer);
  const cx = (x1 + x2) / 2;
  const cy = (y1 + y2) / 2;
  // rotation pointer with reverse angle
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

export const resizeSingleLayer = (
  originalLayers: PointerDownState["originalLayers"],
  shouldMaintainAspectRatio: boolean,
  layer: NonDeletedExcalidrawLayer,
  transformHandleDirection: TransformHandleDirection,
  shouldResizeFromCenter: boolean,
  pointerX: number,
  pointerY: number
) => {
  const stateAtResizeStart = originalLayers.get(layer.id)!;
  // Gets bounds corners
  const [x1, y1, x2, y2] = getResizedLayerAbsoluteCoords(
    stateAtResizeStart,
    stateAtResizeStart.width,
    stateAtResizeStart.height,
    true
  );
  const startTopLeft: Point = [x1, y1];
  const startBottomRight: Point = [x2, y2];
  const startCenter: Point = centerPoint(startTopLeft, startBottomRight);

  // Calculate new dimensions based on cursor position
  const rotatedPointer = rotatePoint(
    [pointerX, pointerY],
    startCenter,
    -stateAtResizeStart.angle
  );

  // Get bounds corners rendered on screen
  const [esx1, esy1, esx2, esy2] = getResizedLayerAbsoluteCoords(
    layer,
    layer.width,
    layer.height,
    true
  );

  const boundsCurrentWidth = esx2 - esx1;
  const boundsCurrentHeight = esy2 - esy1;

  // It's important we set the initial scale value based on the width and height at resize start,
  // otherwise previous dimensions affected by modifiers will be taken into account.
  const atStartBoundsWidth = startBottomRight[0] - startTopLeft[0];
  const atStartBoundsHeight = startBottomRight[1] - startTopLeft[1];
  let scaleX = atStartBoundsWidth / boundsCurrentWidth;
  let scaleY = atStartBoundsHeight / boundsCurrentHeight;

  let boundTextFont: { baseline?: number; fontSize?: number } = {};
  const boundTextLayer = getBoundTextLayer(layer);

  if (transformHandleDirection.includes("e")) {
    scaleX = (rotatedPointer[0] - startTopLeft[0]) / boundsCurrentWidth;
  }
  if (transformHandleDirection.includes("s")) {
    scaleY = (rotatedPointer[1] - startTopLeft[1]) / boundsCurrentHeight;
  }
  if (transformHandleDirection.includes("w")) {
    scaleX = (startBottomRight[0] - rotatedPointer[0]) / boundsCurrentWidth;
  }
  if (transformHandleDirection.includes("n")) {
    scaleY = (startBottomRight[1] - rotatedPointer[1]) / boundsCurrentHeight;
  }

  // Linear layers dimensions differ from bounds dimensions
  const eleInitialWidth = stateAtResizeStart.width;
  const eleInitialHeight = stateAtResizeStart.height;
  // We have to use dimensions of layer on screen, otherwise the scaling of the
  // dimensions won't match the cursor for linear layers.
  let eleNewWidth = layer.width * scaleX;
  let eleNewHeight = layer.height * scaleY;

  // adjust dimensions for resizing from center
  if (shouldResizeFromCenter) {
    eleNewWidth = 2 * eleNewWidth - eleInitialWidth;
    eleNewHeight = 2 * eleNewHeight - eleInitialHeight;
  }

  // adjust dimensions to keep sides ratio
  if (shouldMaintainAspectRatio) {
    const widthRatio = Math.abs(eleNewWidth) / eleInitialWidth;
    const heightRatio = Math.abs(eleNewHeight) / eleInitialHeight;
    if (transformHandleDirection.length === 1) {
      eleNewHeight *= widthRatio;
      eleNewWidth *= heightRatio;
    }
    if (transformHandleDirection.length === 2) {
      const ratio = Math.max(widthRatio, heightRatio);
      eleNewWidth = eleInitialWidth * ratio * Math.sign(eleNewWidth);
      eleNewHeight = eleInitialHeight * ratio * Math.sign(eleNewHeight);
    }
  }

  if (boundTextLayer) {
    const stateOfBoundTextLayerAtResize = originalLayers.get(
      boundTextLayer.id
    ) as typeof boundTextLayer | undefined;
    if (stateOfBoundTextLayerAtResize) {
      boundTextFont = {
        fontSize: stateOfBoundTextLayerAtResize.fontSize,
        baseline: stateOfBoundTextLayerAtResize.baseline
      };
    }
    if (shouldMaintainAspectRatio) {
      const updatedLayer = {
        ...layer,
        width: eleNewWidth,
        height: eleNewHeight
      };

      const nextFont = measureFontSizeFromWidth(
        boundTextLayer,
        getBoundTextMaxWidth(updatedLayer),
        getBoundTextMaxHeight(updatedLayer, boundTextLayer)
      );
      if (nextFont === null) {
        return;
      }
      boundTextFont = {
        fontSize: nextFont.size,
        baseline: nextFont.baseline
      };
    } else {
      const minWidth = getApproxMinContainerWidth(
        getFontString(boundTextLayer),
        boundTextLayer.lineHeight
      );
      const minHeight = getApproxMinContainerHeight(
        boundTextLayer.fontSize,
        boundTextLayer.lineHeight
      );
      eleNewWidth = Math.ceil(Math.max(eleNewWidth, minWidth));
      eleNewHeight = Math.ceil(Math.max(eleNewHeight, minHeight));
    }
  }

  const [newBoundsX1, newBoundsY1, newBoundsX2, newBoundsY2] =
    getResizedLayerAbsoluteCoords(
      stateAtResizeStart,
      eleNewWidth,
      eleNewHeight,
      true
    );
  const newBoundsWidth = newBoundsX2 - newBoundsX1;
  const newBoundsHeight = newBoundsY2 - newBoundsY1;

  // Calculate new topLeft based on fixed corner during resize
  let newTopLeft = [...startTopLeft] as [number, number];
  if (["n", "w", "nw"].includes(transformHandleDirection)) {
    newTopLeft = [
      startBottomRight[0] - Math.abs(newBoundsWidth),
      startBottomRight[1] - Math.abs(newBoundsHeight)
    ];
  }
  if (transformHandleDirection === "ne") {
    const bottomLeft = [startTopLeft[0], startBottomRight[1]];
    newTopLeft = [bottomLeft[0], bottomLeft[1] - Math.abs(newBoundsHeight)];
  }
  if (transformHandleDirection === "sw") {
    const topRight = [startBottomRight[0], startTopLeft[1]];
    newTopLeft = [topRight[0] - Math.abs(newBoundsWidth), topRight[1]];
  }

  // Keeps opposite handle fixed during resize
  if (shouldMaintainAspectRatio) {
    if (["s", "n"].includes(transformHandleDirection)) {
      newTopLeft[0] = startCenter[0] - newBoundsWidth / 2;
    }
    if (["e", "w"].includes(transformHandleDirection)) {
      newTopLeft[1] = startCenter[1] - newBoundsHeight / 2;
    }
  }

  // Flip horizontally
  if (eleNewWidth < 0) {
    if (transformHandleDirection.includes("e")) {
      newTopLeft[0] -= Math.abs(newBoundsWidth);
    }
    if (transformHandleDirection.includes("w")) {
      newTopLeft[0] += Math.abs(newBoundsWidth);
    }
  }
  // Flip vertically
  if (eleNewHeight < 0) {
    if (transformHandleDirection.includes("s")) {
      newTopLeft[1] -= Math.abs(newBoundsHeight);
    }
    if (transformHandleDirection.includes("n")) {
      newTopLeft[1] += Math.abs(newBoundsHeight);
    }
  }

  if (shouldResizeFromCenter) {
    newTopLeft[0] = startCenter[0] - Math.abs(newBoundsWidth) / 2;
    newTopLeft[1] = startCenter[1] - Math.abs(newBoundsHeight) / 2;
  }

  // adjust topLeft to new rotation point
  const angle = stateAtResizeStart.angle;
  const rotatedTopLeft = rotatePoint(newTopLeft, startCenter, angle);
  const newCenter: Point = [
    newTopLeft[0] + Math.abs(newBoundsWidth) / 2,
    newTopLeft[1] + Math.abs(newBoundsHeight) / 2
  ];
  const rotatedNewCenter = rotatePoint(newCenter, startCenter, angle);
  newTopLeft = rotatePoint(rotatedTopLeft, rotatedNewCenter, -angle);

  // Readjust points for linear layers
  let rescaledLayerPointsY;
  let rescaledPoints;

  if (isLinearLayer(layer) || isFreeDrawLayer(layer)) {
    rescaledLayerPointsY = rescalePoints(
      1,
      eleNewHeight,
      (stateAtResizeStart as ExcalidrawLinearLayer).points,
      true
    );

    rescaledPoints = rescalePoints(0, eleNewWidth, rescaledLayerPointsY, true);
  }

  // For linear layers (x,y) are the coordinates of the first drawn point not the top-left corner
  // So we need to readjust (x,y) to be where the first point should be
  const newOrigin = [...newTopLeft];
  newOrigin[0] += stateAtResizeStart.x - newBoundsX1;
  newOrigin[1] += stateAtResizeStart.y - newBoundsY1;
  const resizedLayer = {
    width: Math.abs(eleNewWidth),
    height: Math.abs(eleNewHeight),
    x: newOrigin[0],
    y: newOrigin[1],
    points: rescaledPoints
  };

  if ("scale" in layer && "scale" in stateAtResizeStart) {
    mutateLayer(layer, {
      scale: [
        // defaulting because scaleX/Y can be 0/-0
        (Math.sign(newBoundsX2 - stateAtResizeStart.x) ||
          stateAtResizeStart.scale[0]) * stateAtResizeStart.scale[0],
        (Math.sign(newBoundsY2 - stateAtResizeStart.y) ||
          stateAtResizeStart.scale[1]) * stateAtResizeStart.scale[1]
      ]
    });
  }

  if (
    resizedLayer.width !== 0 &&
    resizedLayer.height !== 0 &&
    Number.isFinite(resizedLayer.x) &&
    Number.isFinite(resizedLayer.y)
  ) {
    updateBoundLayers(layer, {
      newSize: { width: resizedLayer.width, height: resizedLayer.height }
    });

    mutateLayer(layer, resizedLayer);
    if (boundTextLayer && boundTextFont != null) {
      mutateLayer(boundTextLayer, {
        fontSize: boundTextFont.fontSize,
        baseline: boundTextFont.baseline
      });
    }
    handleBindTextResize(layer, transformHandleDirection);
  }
};

export const resizeMultipleLayers = (
  pointerDownState: PointerDownState,
  selectedLayers: readonly NonDeletedExcalidrawLayer[],
  transformHandleType: "nw" | "ne" | "sw" | "se",
  shouldResizeFromCenter: boolean,
  pointerX: number,
  pointerY: number
) => {
  // map selected layers to the original layers. While it never should
  // happen that pointerDownState.originalLayers won't contain the selected
  // layers during resize, this coupling isn't guaranteed, so to ensure
  // type safety we need to transform only those layers we filter.
  const targetLayers = selectedLayers.reduce(
    (
      acc: {
        /** latest layer */
        latest: NonDeletedExcalidrawLayer;
        /** layer at resize start */
        orig: NonDeletedExcalidrawLayer;
      }[],
      layer
    ) => {
      const origLayer = pointerDownState.originalLayers.get(layer.id);
      if (origLayer) {
        acc.push({ orig: origLayer, latest: layer });
      }
      return acc;
    },
    []
  );

  // getCommonBoundingBox() uses getBoundTextLayer() which returns null for
  // original layers from pointerDownState, so we have to find and add these
  // bound text layers manually. Additionally, the coordinates of bound text
  // layers aren't always up to date.
  const boundTextLayers = targetLayers.reduce((acc, { orig }) => {
    if (!isLinearLayer(orig)) {
      return acc;
    }
    const textId = getBoundTextLayerId(orig);
    if (!textId) {
      return acc;
    }
    const text = pointerDownState.originalLayers.get(textId) ?? null;
    if (!isBoundToContainer(text)) {
      return acc;
    }
    const xy = LinearLayerEditor.getBoundTextLayerPosition(orig, text);
    return [...acc, { ...text, ...xy }];
  }, [] as ExcalidrawTextLayerWithContainer[]);

  const { minX, minY, maxX, maxY, midX, midY } = getCommonBoundingBox(
    targetLayers.map(({ orig }) => orig).concat(boundTextLayers)
  );
  const direction = transformHandleType;

  const mapDirectionsToAnchors: Record<typeof direction, Point> = {
    ne: [minX, maxY],
    se: [minX, minY],
    sw: [maxX, minY],
    nw: [maxX, maxY]
  };

  // anchor point must be on the opposite side of the dragged selection handle
  // or be the center of the selection if shouldResizeFromCenter
  const [anchorX, anchorY]: Point = shouldResizeFromCenter
    ? [midX, midY]
    : mapDirectionsToAnchors[direction];

  const scale =
    Math.max(
      Math.abs(pointerX - anchorX) / (maxX - minX) || 0,
      Math.abs(pointerY - anchorY) / (maxY - minY) || 0
    ) * (shouldResizeFromCenter ? 2 : 1);

  if (scale === 0) {
    return;
  }

  const mapDirectionsToPointerPositions: Record<
    typeof direction,
    [x: boolean, y: boolean]
  > = {
    ne: [pointerX >= anchorX, pointerY <= anchorY],
    se: [pointerX >= anchorX, pointerY >= anchorY],
    sw: [pointerX <= anchorX, pointerY >= anchorY],
    nw: [pointerX <= anchorX, pointerY <= anchorY]
  };

  /**
   * to flip an layer:
   * 1. determine over which axis is the layer being flipped
   *    (could be x, y, or both) indicated by `flipFactorX` & `flipFactorY`
   * 2. shift layer's position by the amount of width or height (or both) or
   *    mirror points in the case of linear & freedraw elemenets
   * 3. adjust layer angle
   */
  const [flipFactorX, flipFactorY] = mapDirectionsToPointerPositions[
    direction
  ].map((condition) => (condition ? 1 : -1));
  const isFlippedByX = flipFactorX < 0;
  const isFlippedByY = flipFactorY < 0;

  const layersAndUpdates: {
    boundText: {
      baseline: ExcalidrawTextLayer["baseline"];
      fontSize: ExcalidrawTextLayer["fontSize"];
      layer: ExcalidrawTextLayerWithContainer;
    } | null;
    layer: NonDeletedExcalidrawLayer;
    update: Mutable<
      Pick<ExcalidrawLayer, "x" | "y" | "width" | "height" | "angle">
    > & {
      baseline?: ExcalidrawTextLayer["baseline"];
      fontSize?: ExcalidrawTextLayer["fontSize"];
      points?: ExcalidrawLinearLayer["points"];
      scale?: ExcalidrawImageLayer["scale"];
    };
  }[] = [];

  for (const { orig, latest } of targetLayers) {
    // bounded text layers are updated along with their container layers
    if (isTextLayer(orig) && isBoundToContainer(orig)) {
      continue;
    }

    const width = orig.width * scale;
    const height = orig.height * scale;
    const angle = normalizeAngle(orig.angle * flipFactorX * flipFactorY);

    const isLinearOrFreeDraw = isLinearLayer(orig) || isFreeDrawLayer(orig);
    const offsetX = orig.x - anchorX;
    const offsetY = orig.y - anchorY;
    const shiftX = isFlippedByX && !isLinearOrFreeDraw ? width : 0;
    const shiftY = isFlippedByY && !isLinearOrFreeDraw ? height : 0;
    const x = anchorX + flipFactorX * (offsetX * scale + shiftX);
    const y = anchorY + flipFactorY * (offsetY * scale + shiftY);

    const rescaledPoints = rescalePointsInLayer(
      orig,
      width * flipFactorX,
      height * flipFactorY,
      false
    );

    const update: (typeof layersAndUpdates)[0]["update"] = {
      x,
      y,
      width,
      height,
      angle,
      ...rescaledPoints
    };

    if (isImageLayer(orig) && targetLayers.length === 1) {
      update.scale = [orig.scale[0] * flipFactorX, orig.scale[1] * flipFactorY];
    }

    if (isLinearLayer(orig) && (isFlippedByX || isFlippedByY)) {
      const origBounds = getLayerPointsCoords(orig, orig.points);
      const newBounds = getLayerPointsCoords(
        { ...orig, x, y },
        rescaledPoints.points!
      );
      const origXY = [orig.x, orig.y];
      const newXY = [x, y];

      const linearShift = (axis: "x" | "y") => {
        const i = axis === "x" ? 0 : 1;
        return (
          (newBounds[i + 2] -
            newXY[i] -
            (origXY[i] - origBounds[i]) * scale +
            (origBounds[i + 2] - origXY[i]) * scale -
            (newXY[i] - newBounds[i])) /
          2
        );
      };

      if (isFlippedByX) {
        update.x -= linearShift("x");
      }

      if (isFlippedByY) {
        update.y -= linearShift("y");
      }
    }

    let boundText: (typeof layersAndUpdates)[0]["boundText"] = null;

    const boundTextLayer = getBoundTextLayer(latest);

    if (boundTextLayer || isTextLayer(orig)) {
      const updatedLayer = {
        ...latest,
        width,
        height
      };
      const metrics = measureFontSizeFromWidth(
        boundTextLayer ?? (orig as ExcalidrawTextLayer),
        boundTextLayer
          ? getBoundTextMaxWidth(updatedLayer)
          : updatedLayer.width,
        boundTextLayer
          ? getBoundTextMaxHeight(updatedLayer, boundTextLayer)
          : updatedLayer.height
      );

      if (!metrics) {
        return;
      }

      if (isTextLayer(orig)) {
        update.fontSize = metrics.size;
        update.baseline = metrics.baseline;
      }

      if (boundTextLayer) {
        boundText = {
          layer: boundTextLayer,
          fontSize: metrics.size,
          baseline: metrics.baseline
        };
      }
    }

    layersAndUpdates.push({ layer: latest, update, boundText });
  }

  const layersToUpdate = layersAndUpdates.map(({ layer }) => layer);

  for (const { layer, update, boundText } of layersAndUpdates) {
    const { width, height, angle } = update;

    mutateLayer(layer, update, false);

    updateBoundLayers(layer, {
      simultaneouslyUpdated: layersToUpdate,
      newSize: { width, height }
    });

    if (boundText) {
      const { layer: boundTextLayer, ...boundTextUpdates } = boundText;
      mutateLayer(
        boundTextLayer,
        {
          ...boundTextUpdates,
          angle: isLinearLayer(layer) ? undefined : angle
        },
        false
      );
      handleBindTextResize(layer, transformHandleType);
    }
  }

  Scene.getScene(layersAndUpdates[0].layer)?.informMutation();
};

const rotateMultipleLayers = (
  pointerDownState: PointerDownState,
  layers: readonly NonDeletedExcalidrawLayer[],
  pointerX: number,
  pointerY: number,
  shouldRotateWithDiscreteAngle: boolean,
  centerX: number,
  centerY: number
) => {
  let centerAngle =
    (5 * Math.PI) / 2 + Math.atan2(pointerY - centerY, pointerX - centerX);
  if (shouldRotateWithDiscreteAngle) {
    centerAngle += SHIFT_LOCKING_ANGLE / 2;
    centerAngle -= centerAngle % SHIFT_LOCKING_ANGLE;
  }

  layers
    .filter((layer) => layer.type !== "frame")
    .forEach((layer) => {
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

export const getResizeOffsetXY = (
  transformHandleType: MaybeTransformHandleType,
  selectedLayers: NonDeletedExcalidrawLayer[],
  x: number,
  y: number
): [number, number] => {
  const [x1, y1, x2, y2] =
    selectedLayers.length === 1
      ? getLayerAbsoluteCoords(selectedLayers[0])
      : getCommonBounds(selectedLayers);
  const cx = (x1 + x2) / 2;
  const cy = (y1 + y2) / 2;
  const angle = selectedLayers.length === 1 ? selectedLayers[0].angle : 0;
  [x, y] = rotate(x, y, cx, cy, -angle);
  switch (transformHandleType) {
    case "n":
      return rotate(x - (x1 + x2) / 2, y - y1, 0, 0, angle);
    case "s":
      return rotate(x - (x1 + x2) / 2, y - y2, 0, 0, angle);
    case "w":
      return rotate(x - x1, y - (y1 + y2) / 2, 0, 0, angle);
    case "e":
      return rotate(x - x2, y - (y1 + y2) / 2, 0, 0, angle);
    case "nw":
      return rotate(x - x1, y - y1, 0, 0, angle);
    case "ne":
      return rotate(x - x2, y - y1, 0, 0, angle);
    case "sw":
      return rotate(x - x1, y - y2, 0, 0, angle);
    case "se":
      return rotate(x - x2, y - y2, 0, 0, angle);
    default:
      return [0, 0];
  }
};

export const getResizeArrowDirection = (
  transformHandleType: MaybeTransformHandleType,
  layer: NonDeleted<ExcalidrawLinearLayer>
): "origin" | "end" => {
  const [, [px, py]] = layer.points;
  const isResizeEnd =
    (transformHandleType === "nw" && (px < 0 || py < 0)) ||
    (transformHandleType === "ne" && px >= 0) ||
    (transformHandleType === "sw" && px <= 0) ||
    (transformHandleType === "se" && (px > 0 || py > 0));
  return isResizeEnd ? "end" : "origin";
};
