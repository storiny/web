import { Canvas } from "fabric";

import { mouseWheelEvent } from "./mouse:wheel";
import { objectAddedEvent } from "./object:added";
// import { objectMovingEvent } from "./object:moving";

/**
 * Binds events to fabric canvas
 * @param canvas Canvas object
 */
export const bindEvents = (canvas: Canvas): void => {
  [
    mouseWheelEvent,
    objectAddedEvent
    // objectMovingEvent
  ].forEach((bindable) => bindable(canvas));
};
