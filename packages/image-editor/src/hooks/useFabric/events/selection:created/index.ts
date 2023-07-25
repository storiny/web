import { Canvas } from "fabric";

import { editorStore, setLayerSelected } from "../../../../store";

export const selectionCreatedEvent = (canvas: Canvas): void => {
  canvas.on("selection:created", (options) => {
    options.selected.forEach((object) => {
      if (object.group) {
        object.group.set({
          cornerColor: "#fff",
          borderOpacityWhenMoving: 0.25,
          cornerSize: 10,
          borderScaleFactor: 1.5,
          borderColor: "#1371ec",
          cornerStrokeColor: "#1371ec",
          transparentCorners: false,
          lockRotation: true
        });
      }

      editorStore.dispatch(setLayerSelected([object.get("id"), true]));
    });
  });
};
