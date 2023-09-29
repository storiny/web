import { Canvas } from "fabric";

import { mouse_wheel_event } from "./mouse-wheel";
import { object_added_event } from "./object-added";
import { object_modified_event } from "./object-modified";
import { object_moving_event } from "./object-moving";
import { object_scaling_event } from "./object-scaling";
import { selection_cleared_event } from "./selection-cleared";
import { selection_created_event } from "./selection-created";
import { selection_updated_event } from "./selection-updated";

/**
 * Binds events to fabric canvas
 * @param canvas Canvas object
 */
export const bind_events = (canvas: Canvas): void => {
  [
    mouse_wheel_event,
    object_added_event,
    object_modified_event,
    selection_created_event,
    selection_cleared_event,
    selection_updated_event,
    object_scaling_event,
    object_moving_event
  ].forEach((bindable) => bindable(canvas));
};
