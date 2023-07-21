import { Canvas } from "fabric";

import { editorStore, selectZoom, setZoom } from "../../../../store";

export const mouseWheelEvent = (canvas: Canvas): void => {
  canvas.on("mouse:wheel", (options) => {
    const delta = options.e.deltaY;
    let zoom = canvas.getZoom();
    zoom *= 0.999 ** delta;

    editorStore.dispatch(setZoom(zoom * 100));

    options.e.preventDefault();
    options.e.stopPropagation();
  });

  editorStore.subscribe(() => {
    const zoom = selectZoom(editorStore.getState());
    canvas.setZoom(zoom / 100);
  });
};
