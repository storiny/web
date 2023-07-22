import { Canvas } from "fabric";

import { editorStore, removeLayer } from "../../../../store";

export const objectRemovedEvent = (canvas: Canvas): void => {
  canvas.on("object:removed", (options) => {
    const object = options.target;
    editorStore.dispatch(removeLayer(object.get("id")));
  });
};
