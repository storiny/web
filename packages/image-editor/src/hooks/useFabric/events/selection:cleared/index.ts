import { Canvas } from "fabric";

import { editorStore, setLayerSelected } from "../../../../store";

export const selectionClearedEvent = (canvas: Canvas): void => {
  canvas.on("selection:cleared", (options) => {
    options.deselected.forEach((object) => {
      editorStore.dispatch(setLayerSelected([object.get("id"), false]));
    });
  });
};
