import { BaseFabricObject, Canvas } from "fabric";

import { CURSORS } from "../../../../constants";
import { editorStore, mutateLayer, selectLayers } from "../../../../store";
import { Layer } from "../../../../types";
import { isGroup } from "../../../../utils";

const syncFabricObjectToLayer = (
  canvas: Canvas,
  object: BaseFabricObject,
  layer: Layer
): void => {
  object.set({
    visible: !layer.hidden,
    locked: layer.locked
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

    if (!isGroup(object)) {
      editorStore.dispatch(
        mutateLayer({
          id: object.get("id"),
          hidden: !object.visible
        })
      );
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
