import { Canvas } from "fabric";
import { nanoid } from "nanoid";

import { LayerType } from "../../../../constants";
import { addLayer, editorStore } from "../../../../store";
import { getNewLayerName } from "../../../../utils";

export const objectAddedEvent = (canvas: Canvas): void => {
  canvas.on("object:added", (options) => {
    const object = options.target;
    const id = nanoid();
    object.set("id", id);
    canvas.setActiveObject(object as any);

    editorStore.dispatch(
      addLayer({
        cornerRadius: 0,
        fill: object.fill as string,
        hidden: !object.visible,
        id,
        locked: false,
        name: getNewLayerName(LayerType.RECTANGLE),
        opacity: Math.round(object.opacity * 100),
        angle: Math.round(object.angle),
        scaleX: object.scaleX,
        scaleY: object.scaleY,
        type: LayerType.RECTANGLE,
        width: object.width,
        height: object.height
      })
    );
  });
};
