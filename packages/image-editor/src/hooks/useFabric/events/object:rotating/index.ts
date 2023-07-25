import { Canvas } from "fabric";

import { editorStore, mutateLayer, selectActiveLayer } from "../../../../store";
import { isInteractiveObject } from "../../../../utils";

export const objectRotatingEvent = (canvas: Canvas): void => {
  canvas.on("object:rotating", (options) => {
    const object = options.target;

    if (isInteractiveObject(object)) {
      editorStore.dispatch(
        mutateLayer({
          id: object.get("id"),
          angle: object.angle
        })
      );
    }
  });

  editorStore.subscribe(() => {
    const activeLayer = selectActiveLayer(editorStore.getState());

    if (activeLayer) {
      canvas.getObjects().forEach((object) => {
        if (object.get("id") === activeLayer.id) {
          object.rotate(activeLayer.angle);
        }
      });
    }
  });
};
