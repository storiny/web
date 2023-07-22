import { Canvas } from "fabric";

import {
  editorStore,
  mutateLayer,
  selectActiveLayerPosition
} from "../../../../store";

export const objectMovingEvent = (canvas: Canvas): void => {
  canvas.on("object:moving", (options) => {
    const object = options.target;

    editorStore.dispatch(
      mutateLayer({
        id: object.get("id"),
        x: object.left,
        y: object.top
      })
    );
  });

  editorStore.subscribe(() => {
    const activeLayerPosition = selectActiveLayerPosition(
      editorStore.getState()
    );

    if (activeLayerPosition) {
      canvas.getObjects().forEach((object) => {
        if (object.get("id") === activeLayerPosition.id) {
          object.set({
            left: activeLayerPosition.x,
            top: activeLayerPosition.y
          });
        }
      });
    }
  });
};
