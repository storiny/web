import { Canvas } from "fabric";

export const selectionClearedEvent = (canvas: Canvas): void => {
  canvas.on("selection:cleared", (options) => {
    for (const object of options.deselected) {
      object.set({
        selected: false
      });
    }
  });
};
