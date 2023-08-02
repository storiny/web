import { Canvas } from "fabric";
import { nanoid } from "nanoid";

import { LayerType } from "../../../../constants";
import { getNewLayerName, isInteractiveObject } from "../../../../utils";

export const objectAddedEvent = (canvas: Canvas): void => {
  canvas.on("object:added", (options) => {
    const object = options.target;

    if (!isInteractiveObject(object as any) && !object.isType("path")) {
      return;
    }

    const locked = object.get("locked");

    if (object.isType("path")) {
      object.set({
        id: object.get("id") || nanoid(),
        locked: typeof locked === "undefined" ? false : locked,
        selected: true,
        _type: LayerType.PEN,
        name: object.get("name")
        // || getNewLayerName(object.get("_type"), canvas)
      });
    } else {
      object.set({
        id: object.get("id") || nanoid(),
        locked: typeof locked === "undefined" ? false : locked,
        selected: true,
        name:
          object.get("name") || getNewLayerName(object.get("_type"), canvas),
        height: object.height * object.scaleY,
        width: object.width * object.scaleX,
        scaleY: 1,
        scaleX: 1
      });
    }

    canvas.isDrawingMode = false;
    canvas.setActiveObject(object as any);
  });
};
