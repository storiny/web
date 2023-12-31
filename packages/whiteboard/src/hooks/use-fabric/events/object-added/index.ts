import { Canvas, FabricObject } from "fabric";
import { nanoid } from "nanoid";

import {
  get_new_layer_name,
  is_interactive_object,
  is_pen_object,
  is_scalable_object
} from "../../../../utils";

export const object_added_event = (canvas: Canvas): void => {
  canvas.on("object:added", (options) => {
    const object = options.target as FabricObject;

    if (!is_interactive_object(object)) {
      return;
    }

    const locked = object.get("locked");

    object.set({
      id: object.get("id") || nanoid(),
      locked: typeof locked === "undefined" ? false : locked,
      selected: !is_pen_object(object),
      name:
        object.get("name") || get_new_layer_name(object.get("_type"), canvas)
    });

    if (!is_scalable_object(object)) {
      object.set({
        height: object.height * object.scaleY,
        width: object.width * object.scaleX,
        scaleY: 1,
        scaleX: 1
      });
    }

    if (!is_pen_object(object) || !canvas.isDrawingMode) {
      canvas.setActiveObject(object as any);
    }
  });
};
