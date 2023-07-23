import { Canvas } from "fabric";

import { editorStore, setLayerSelected } from "../../../../store";

export const selectionUpdatedEvent = (canvas: Canvas): void => {
  canvas.on("selection:updated", (options) => {
    const { selected, deselected } = options;

    selected.forEach((object) => {
      if (object.group) {
        object.group.set({
          cornerColor: "#fff",
          cornerSize: 10,
          cornerStrokeColor: "#1371ec",
          borderOpacityWhenMoving: 0.25,
          transparentCorners: false
        });
      }

      editorStore.dispatch(setLayerSelected([object.get("id"), true]));
    });

    deselected.forEach((object) => {
      editorStore.dispatch(setLayerSelected([object.get("id"), false]));
    });
  });
};
