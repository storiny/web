import { Canvas } from "fabric";

import { isInteractiveObject } from "../../../../utils";

export const objectModifiedEvent = (canvas: Canvas): void => {
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
