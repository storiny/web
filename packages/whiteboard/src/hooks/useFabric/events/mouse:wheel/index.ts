import { Canvas, Point } from "fabric";

import { clamp } from "~/utils/clamp";

import { MAX_ZOOM_LEVEL, MIN_ZOOM_LEVEL } from "../../../../constants";

export const mouseWheelEvent = (canvas: Canvas): void => {
  canvas.on("mouse:wheel", (options) => {
    const delta = options.e.deltaY;
    let zoom = canvas.getZoom();
    zoom *= 0.999 ** delta;

    canvas.zoomToPoint(
      new Point(options.e.offsetX, options.e.offsetY),
      clamp(MIN_ZOOM_LEVEL, zoom * 100, MAX_ZOOM_LEVEL) / 100
    );

    options.e.preventDefault();
    options.e.stopPropagation();
  });
};
