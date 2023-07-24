import { Canvas } from "fabric";

import { isGroup } from "../../../../utils";

export const objectScalingEvent = (canvas: Canvas): void => {
  canvas.on("object:scaling", (options) => {
    const object = options.target;

    if (isGroup(object)) {
      const objects = object.getObjects();
      for (const groupObject of objects) {
        const { x, y } = groupObject.getTotalObjectScaling();
        groupObject.set({
          height: groupObject.height * y,
          width: groupObject.width * x,
          scaleX: 1,
          scaleY: 1
        });
      }
    } else {
      object.set({
        height: object.height * object.scaleY,
        width: object.width * object.scaleX,
        scaleX: 1,
        scaleY: 1
      });
    }
  });
};
