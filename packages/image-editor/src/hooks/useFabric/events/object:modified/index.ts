import { BaseFabricObject, Canvas } from "fabric";

import { CURSORS } from "../../../../constants";
import { editorStore, selectLayers } from "../../../../store";
import { BareLayer } from "../../../../types";
import { isInteractiveObject } from "../../../../utils";

const syncFabricObjectToLayer = (
  canvas: Canvas,
  object: BaseFabricObject,
  layer: BareLayer
): void => {
  object.set({
    visible: !layer.hidden,
    locked: layer.locked,
    selected: layer.selected
  });

  if (layer.locked) {
    object.set({
      selectable: false,
      hasControls: false,
      hoverCursor: CURSORS.default
    });

    // Deselect active object
    if (canvas.getActiveObject()?.get?.("id") === layer.id) {
      canvas.discardActiveObject();
    }
  } else {
    object.set({
      selectable: true,
      hasControls: true,
      hoverCursor: CURSORS.move
    });
  }
};

export const objectModifiedEvent = (canvas: Canvas): void => {
  canvas.on("object:modified", (options) => {
    const object = options.target;

    if (isInteractiveObject(object)) {
      object.set({
        height: object.height * object.scaleY,
        width: object.width * object.scaleX,
        scaleX: 1,
        scaleY: 1
      });
    }
  });

  editorStore.subscribe(() => {
    const layers = selectLayers(editorStore.getState());

    canvas.getObjects().forEach((object) => {
      layers.some((layer) =>
        layer.id === object.get("id")
          ? syncFabricObjectToLayer(canvas, object, layer)
          : undefined
      );
    });
  });
};
