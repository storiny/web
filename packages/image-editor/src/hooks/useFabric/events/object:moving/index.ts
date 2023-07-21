import { Canvas } from "fabric";

const grid = 50;

export const objectMovingEvent = (canvas: Canvas): void => {
  canvas.on("object:moving", (options) => {
    if (
      Math.round((options.target.left / grid) * 4) % 4 == 0 &&
      Math.round((options.target.top / grid) * 4) % 4 == 0
    ) {
      options.target
        .set({
          left: Math.round(options.target.left / grid) * grid,
          top: Math.round(options.target.top / grid) * grid
        })
        .setCoords();
    }
  });
};
