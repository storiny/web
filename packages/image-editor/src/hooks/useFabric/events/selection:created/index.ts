import { Canvas } from "fabric";

export const selectionCreatedEvent = (canvas: Canvas): void => {
  canvas.on("selection:created", (options) => {
    for (const object of options.selected) {
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

      object.set({
        selected: true
      });
    }
  });
};
