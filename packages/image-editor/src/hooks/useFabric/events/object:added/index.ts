import { Canvas } from "fabric";
import { nanoid } from "nanoid";

import { LayerType } from "../../../../constants";
import { addLayer, editorStore } from "../../../../store";
import { getNewLayerName } from "../../../../utils";

export const objectAddedEvent = (canvas: Canvas): void => {
  canvas.on("object:added", (options) => {
    const object = options.target;

    // Skip tooltips
    if (object.get("tooltip")) {
      return;
    }

    const id = nanoid();
    object.set("id", id);
    canvas.setActiveObject(object as any);

    editorStore.dispatch(
      addLayer({
        hidden: !object.visible,
        id,
        locked: false,
        name: getNewLayerName(object.get("_type")),
        type: object.get("_type")
      })
    );
  });
};
