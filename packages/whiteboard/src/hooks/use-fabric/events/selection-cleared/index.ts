import { Canvas } from "fabric";

export const selection_cleared_event = (canvas: Canvas): void => {
  canvas.on("selection:cleared", (options) => {
    canvas.uniformScaling = false;

    for (const object of options.deselected) {
      object.set({
        selected: false
      });
    }
  });
};
