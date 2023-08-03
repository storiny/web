import { Canvas } from "fabric";
import { nanoid } from "nanoid";

import { getNewLayerName, isInteractiveObject } from "../../../../utils";

export const objectAddedEvent = (canvas: Canvas): void => {
  canvas.on("object:added", (options) => {
    const object = options.target;

    if (!isInteractiveObject(object as any) && !object.isType("path")) {
      return;
    }

    const locked = object.get("locked");
    object.set({
      id: object.get("id") || nanoid(),
      locked: typeof locked === "undefined" ? false : locked,
      selected: true,
      name: object.get("name") || getNewLayerName(object.get("_type"), canvas),
      height: object.height * object.scaleY,
      width: object.width * object.scaleX,
      scaleY: 1,
      scaleX: 1
    });

    // canvas.isDrawingMode = false;
    canvas.setActiveObject(object as any);
  });
};
