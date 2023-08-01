import { Canvas } from "fabric";

import { syncLinearPoints } from "../../../../utils";

export const objectMovingEvent = (canvas: Canvas): void => {
  canvas.on("object:moving", (options) => {
    const object = options.target;
    syncLinearPoints(object);
  });
};
