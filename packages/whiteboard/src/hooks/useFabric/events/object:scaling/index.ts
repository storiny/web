import { Canvas } from "fabric";

import {
  isGroup,
  isInteractiveObject,
  isScalableObject
} from "../../../../utils";

export const objectScalingEvent = (canvas: Canvas): void => {
  canvas.on("object:scaling", (options) => {
    const object = options.target;

    if (isGroup(object)) {
      const objects = object.getObjects();

      for (const groupObject of objects) {
        if (!isScalableObject(groupObject)) {
          groupObject.set({
            scaleY: object.scaleY,
            scaleX: object.scaleX
          });
        }
      }
    }

    if (isInteractiveObject(object) && !isScalableObject(object)) {
      object.set({
        height: object.height * object.scaleY,
        width: object.width * object.scaleX,
        scaleX: 1,
        scaleY: 1
      });
    }
  });
};
