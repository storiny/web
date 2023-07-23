import { Canvas } from "fabric";

import { editorStore, mutateLayer, selectActiveLayer } from "../../../../store";
import { isGroup } from "../../../../utils";

export const objectScalingEvent = (canvas: Canvas): void => {
  canvas.on("object:scaling", (options) => {
    const object = options.target;

    if (isGroup(object)) {
      const objects = object.getObjects();
      for (const groupObject of objects) {
        const { x, y } = groupObject.getTotalObjectScaling();
        editorStore.dispatch(
          mutateLayer({
            id: groupObject.get("id"),
            scaleY: y,
            scaleX: x,
            height: groupObject.height,
            width: groupObject.width,
            lastScalingCommitSource: "lib"
          })
        );
      }
    } else {
      editorStore.dispatch(
        mutateLayer({
          id: object.get("id"),
          scaleY: object.scaleY,
          scaleX: object.scaleX,
          height: object.height,
          width: object.width,
          lastScalingCommitSource: "lib"
        })
      );
    }
  });

  editorStore.subscribe(() => {
    const activeLayer = selectActiveLayer(editorStore.getState());

    if (activeLayer) {
      canvas.getObjects().forEach((object) => {
        if (object.get("id") === activeLayer.id) {
          // Ignore syncing changes that are already latest in the fabric store
          if (activeLayer.lastScalingCommitSource !== "lib") {
            object.set({
              scaleY: activeLayer.scaleY,
              scaleX: activeLayer.scaleX
            });
          }

          object.set({
            height: activeLayer.height,
            width: activeLayer.width,
            rx: activeLayer.cornerRadius * (1 / activeLayer.scaleX),
            ry: activeLayer.cornerRadius * (1 / activeLayer.scaleY)
          });
        }
      });
    }
  });
};
