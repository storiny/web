import { Canvas } from "fabric";

import { LayerType, StrokeStyle } from "../../../../constants";
import { addLayer, editorStore } from "../../../../store";

export const objectAddedEvent = (canvas: Canvas): void => {
  canvas.on("object:added", (options) => {
    const object = options.target;

    editorStore.dispatch(
      addLayer({
        type: LayerType.RECTANGLE,
        hidden: !object.visible,
        name: "Rectangle",
        fill: "",
        height: object.height,
        width: object.width,
        rotation: object.angle,
        cornerRadius: 0,
        locked: false,
        opacity: object.opacity,
        strokeColor: "",
        strokeStyle: StrokeStyle.SOLID,
        strokeWidth: object.strokeWidth,
        x: object.left,
        y: object.top
      })
    );
  });
};
