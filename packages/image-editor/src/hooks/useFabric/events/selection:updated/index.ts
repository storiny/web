import { Canvas } from "fabric";

export const selectionUpdatedEvent = (canvas: Canvas): void => {
  canvas.on("selection:updated", (options) => {
    for (const object of options.selected) {
      if (object.group) {
        object.group.set({
          cornerColor: "#fff",
          cornerSize: 10,
          cornerStrokeColor: "#1371ec",
          borderOpacityWhenMoving: 0.25,
          transparentCorners: false,
          lockRotation: true
        });
      }

      object.set({
        selected: true
      });
    }

    for (const object of options.deselected) {
      object.set({
        selected: false
      });
    }
  });
};
