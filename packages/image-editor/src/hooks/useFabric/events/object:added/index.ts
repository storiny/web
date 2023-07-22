import { Canvas } from "fabric";
import { nanoid } from "nanoid";

import { LayerType, StrokeStyle } from "../../../../constants";
import { addLayer, editorStore } from "../../../../store";

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
        height: object.height,
        hidden: !object.visible,
        id,
        locked: false,
        name: "Rectangle",
        opacity: object.opacity,
        rotating: false,
        rotation: object.angle,
        scaleX: object.scaleX,
        scaleY: object.scaleY,
        strokeColor: "",
        strokeStyle: StrokeStyle.SOLID,
        strokeWidth: object.strokeWidth,
        type: LayerType.RECTANGLE,
        width: object.width,
        x: object.left,
        y: object.top
      })
    );
  });
};
