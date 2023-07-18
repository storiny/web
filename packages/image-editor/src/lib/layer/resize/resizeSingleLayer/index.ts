import {
  LinearLayer,
  NonDeletedLayer,
  Point,
  PointerDownState
} from "../../../../types";
import { centerPoint, rotatePoint } from "../../../math";
import { rescalePoints } from "../../../point";
import { getFontString } from "../../../utils";
import { updateBoundLayers } from "../../binding";
import { getResizedLayerAbsoluteCoords } from "../../bounds";
import { mutateLayer } from "../../mutate";
import { isFreeDrawLayer, isLinearLayer } from "../../predicates";
import {
  getApproxMinContainerHeight,
  getApproxMinContainerWidth,
  getBoundTextLayer,
  getBoundTextMaxHeight,
  getBoundTextMaxWidth,
  handleBindTextResize
} from "../../text";
import { TransformHandleDirection } from "../../transformHandles";
import { measureFontSizeFromWidth } from "../measureFontSizeFromWidth";

/**
 * Resizes a single layer
 * @param originalLayers Original layers
 * @param shouldMaintainAspectRatio Whether to maintain aspect ratio
 * @param layer Layer to resize
 * @param transformHandleDirection Transform handle direction
 * @param shouldResizeFromCenter Whether to resize from center
 * @param pointerX Pointer X position
 * @param pointerY Pointer Y position
 */
export const resizeSingleLayer = (
  originalLayers: PointerDownState["originalLayers"],
  shouldMaintainAspectRatio: boolean,
  layer: NonDeletedLayer,
  transformHandleDirection: TransformHandleDirection,
  shouldResizeFromCenter: boolean,
  pointerX: number,
  pointerY: number
): void => {
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

  // It's important that we set the initial scale value based on the width and height at resize start,
  // otherwise previous dimensions affected by modifiers will be taken into account
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
  // dimensions won't match the cursor for linear layers
  let eleNewWidth = layer.width * scaleX;
  let eleNewHeight = layer.height * scaleY;

  // Adjust dimensions for resizing from the center
  if (shouldResizeFromCenter) {
    eleNewWidth = 2 * eleNewWidth - eleInitialWidth;
    eleNewHeight = 2 * eleNewHeight - eleInitialHeight;
  }

  // Adjust dimensions to keep the sides ratio
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

  // Calculate new topLeft based on the fixed corner during resize
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

  // Keeps the opposite handle fixed during resize
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

  // Adjust topLeft to new rotation point
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
      (stateAtResizeStart as LinearLayer).points,
      true
    );

    rescaledPoints = rescalePoints(0, eleNewWidth, rescaledLayerPointsY, true);
  }

  // We need to readjust (x,y) to be where the first point should be
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
        // Defaulting because scaleX/Y can be 0/-0
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

    if (boundTextLayer) {
      mutateLayer(boundTextLayer, {
        fontSize: boundTextFont.fontSize,
        baseline: boundTextFont.baseline
      });
    }

    handleBindTextResize(layer, transformHandleDirection);
  }
};
