import { Canvas } from "fabric";

import { isInteractiveObject } from "../../../../utils";

export const objectScalingEvent = (canvas: Canvas): void => {
  canvas.on("object:scaling", (options) => {
    const object = options.target;

    if (isInteractiveObject(object)) {
      object.set({
        height: object.height * object.scaleY,
        width: object.width * object.scaleX,
        scaleX: 1,
        scaleY: 1
      });
    }
  });
};
