import { Canvas } from "fabric";

import { mouseWheelEvent } from "./mouse:wheel";
import { objectAddedEvent } from "./object:added";
import { objectModifiedEvent } from "./object:modified";
import { objectRemovedEvent } from "./object:removed";
import { objectScalingEvent } from "./object:scaling";
import { selectionClearedEvent } from "./selection:cleared";
import { selectionCreatedEvent } from "./selection:created";
import { selectionUpdatedEvent } from "./selection:updated";

/**
 * Binds events to fabric canvas
 * @param canvas Canvas object
 */
export const bindEvents = (canvas: Canvas): void => {
  [
    mouseWheelEvent,
    objectAddedEvent,
    objectModifiedEvent,
    selectionCreatedEvent,
    selectionClearedEvent,
    selectionUpdatedEvent,
    objectRemovedEvent,
    objectScalingEvent
  ].forEach((bindable) => bindable(canvas));
};
