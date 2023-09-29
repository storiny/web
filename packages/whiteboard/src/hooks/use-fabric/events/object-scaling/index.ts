import { Canvas } from "fabric";

import {
  is_group,
  is_interactive_object,
  is_scalable_object
} from "../../../../utils";

export const object_scaling_event = (canvas: Canvas): void => {
  canvas.on("object:scaling", (options) => {
    const object = options.target;

    if (is_group(object)) {
      const objects = object.getObjects();

      for (const group_object of objects) {
        if (!is_scalable_object(group_object)) {
          group_object.set({
            scaleY: object.scaleY,
            scaleX: object.scaleX
          });
        }
      }
    }

    if (is_interactive_object(object) && !is_scalable_object(object)) {
      object.set({
        height: object.height * object.scaleY,
        width: object.width * object.scaleX,
        scaleX: 1,
        scaleY: 1
      });
    }
  });
};
