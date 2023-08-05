import { BaseFabricObject } from "fabric";

import { isArrowObject } from "../isArrowObject";
import { isImageObject } from "../isImageObject";
import { isLinearObject } from "../isLinearObject";
import { isPenObject } from "../isPenObject";
import { isScalableObject } from "../isScalableObject";
import { syncLinearPoints } from "../syncLinearPoints";

/**
 * Recovers an object be assigning it the required properties
 * @param object Object to recover
 * @param prop Additional properties
 */
export const recoverObject = (object: BaseFabricObject, prop: any): void => {
  object.set({
    left: prop.left,
    top: prop.top,
    width: prop.width,
    height: prop.height,
    angle: prop.angle,
    locked: prop.locked,
    visible: prop.visible
  });

  if (isScalableObject(object)) {
    object.set({
      scaleX: prop.scaleX,
      scaleY: prop.scaleY
    });
  } else {
    object.set({
      scaleX: 1,
      scaleY: 1
    });
  }

  if (isPenObject(object)) {
    object.set({
      penWidth: prop.penWidth,
      penStyle: prop.penStyle,
      points: prop.points,
      shadow: prop.shadow,
      fill: prop.fill
    });
  }

  if (isLinearObject(object)) {
    object.set({
      x1: prop.x1,
      x2: prop.x2,
      y1: prop.y1,
      y2: prop.y2
    });

    // Set arrowheads
    if (isArrowObject(object)) {
      object.set({
        startArrowhead: prop.startArrowhead,
        endArrowhead: prop.endArrowhead
      });
    }

    syncLinearPoints(object);
  }

  if (isImageObject(object)) {
    object.filters = [...prop.filters];
  }

  if (object.canvas) {
    object.canvas.requestRenderAll();
  }
};
