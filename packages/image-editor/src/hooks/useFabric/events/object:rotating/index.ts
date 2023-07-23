import { Canvas } from "fabric";

import { MAX_ANGLE } from "../../../../constants";
import { editorStore, mutateLayer, selectActiveLayer } from "../../../../store";
import { isGroup } from "../../../../utils";

export const objectRotatingEvent = (canvas: Canvas): void => {
  canvas.on("object:rotating", (options) => {
    const object = options.target;

    if (isGroup(object)) {
      const objects = object.getObjects();
      for (const groupObject of objects) {
        const totalAngle = groupObject.getTotalAngle();

        editorStore.dispatch(
          mutateLayer({
            id: groupObject.get("id"),
            angle:
              totalAngle < 0 ? MAX_ANGLE - Math.abs(totalAngle) : totalAngle,
            lastRotationCommitSource: "lib"
          })
        );
      }
    } else {
      editorStore.dispatch(
        mutateLayer({
          id: object.get("id"),
          angle: object.angle,
          lastRotationCommitSource: "lib"
        })
      );
    }
  });

  editorStore.subscribe(() => {
    const activeLayer = selectActiveLayer(editorStore.getState());

    if (
      activeLayer &&
      activeLayer.lastRotationCommitSource !== "lib" &&
      activeLayer.lastScalingCommitSource !== "lib"
    ) {
      canvas.getObjects().forEach((object) => {
        if (object.get("id") === activeLayer.id) {
          object.rotate(activeLayer.angle);
        }
      });
    }
  });
};
