import { Canvas } from "fabric";

import { is_interactive_object, is_scalable_object } from "../../../../utils";

export const object_modified_event = (canvas: Canvas): void => {
  canvas.on("object:modified", (options) => {
    const object = options.target;

    if (object.get("locked")) {
      object.set({
        selectable: false,
        hasControls: false
      });

      // Deselect active object
      if (canvas.getActiveObject()?.get?.("id") === object.get("id")) {
        canvas.discardActiveObject();
      }
    } else {
      object.set({
        selectable: true,
        hasControls: true
      });
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
