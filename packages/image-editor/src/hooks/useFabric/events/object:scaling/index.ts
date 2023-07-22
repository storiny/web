import { Canvas } from "fabric";

import {
  editorStore,
  mutateLayer,
  selectActiveLayerSize
} from "../../../../store";

export const objectScalingEvent = (canvas: Canvas): void => {
  canvas.on("object:scaling", (options) => {
    const object = options.target;

    editorStore.dispatch(
      mutateLayer({
        id: object.get("id"),
        height: object.height,
        width: object.width,
        scaleX: object.scaleX,
        scaleY: object.scaleY
      })
    );
  });

  editorStore.subscribe(() => {
    const activeLayerSize = selectActiveLayerSize(editorStore.getState());

    if (activeLayerSize) {
      canvas.getObjects().forEach((object) => {
        if (object.get("id") === activeLayerSize.id) {
          object.set({
            width: activeLayerSize.width,
            height: activeLayerSize.height,
            scaleX: activeLayerSize.scaleX,
            scaleY: activeLayerSize.scaleY
          });
        }
      });
    }
  });
};
