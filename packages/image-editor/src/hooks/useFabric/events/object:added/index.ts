import { BaseFabricObject, Canvas } from "fabric";
import { nanoid } from "nanoid";

import {
  getNewLayerName,
  isInteractiveObject,
  isPenObject,
  isScalableObject
} from "../../../../utils";

export const objectAddedEvent = (canvas: Canvas): void => {
  canvas.on("object:added", (options) => {
    const object = options.target as BaseFabricObject;

    if (!isInteractiveObject(object)) {
      return;
    }

    const locked = object.get("locked");

    object.set({
      id: object.get("id") || nanoid(),
      locked: typeof locked === "undefined" ? false : locked,
      selected: !isPenObject(object),
      name: object.get("name") || getNewLayerName(object.get("_type"), canvas)
    });

    if (!isScalableObject(object)) {
      object.set({
        height: object.height * object.scaleY,
        width: object.width * object.scaleX,
        scaleY: 1,
        scaleX: 1
      });
    }

    if (!isPenObject(object) || !canvas.isDrawingMode) {
      canvas.setActiveObject(object as any);
    }
  });
};
