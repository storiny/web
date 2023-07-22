import { Canvas } from "fabric";

import {
  editorStore,
  mutateLayer,
  selectActiveLayerRotation
} from "../../../../store";

export const objectRotatingEvent = (canvas: Canvas): void => {
  canvas.on("object:rotating", (options) => {
    const object = options.target;

    editorStore.dispatch(
      mutateLayer({
        id: object.get("id"),
        rotation: Math.round(object.angle)
      })
    );
  });

  editorStore.subscribe(() => {
    const activeLayerRotation = selectActiveLayerRotation(
      editorStore.getState()
    );

    if (activeLayerRotation) {
      canvas.getObjects().forEach((object) => {
        if (object.get("id") === activeLayerRotation.id) {
          object.rotate(activeLayerRotation.rotation);
        }
      });
    }
  });
};
