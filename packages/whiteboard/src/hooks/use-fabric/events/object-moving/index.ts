import { Canvas } from "fabric";

import { sync_linear_points } from "../../../../utils";

export const object_moving_event = (canvas: Canvas): void => {
  canvas.on("object:moving", (options) => {
    const object = options.target;
    sync_linear_points(object);
  });
};
