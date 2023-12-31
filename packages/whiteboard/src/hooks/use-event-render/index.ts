import { CanvasEvents } from "fabric";
import React from "react";

import { use_canvas } from "../index";

/**
 * Hook for force re-rendering on canvas event
 * @param event_name Event name
 * @param callback Callback
 */
export const use_event_render = <
  K extends keyof CanvasEvents,
  E extends CanvasEvents[K]
>(
  event_name: K,
  callback: (options: E) => boolean
): void => {
  const canvas = use_canvas();
  const [, force_update] = React.useReducer((x) => x + 1, 0);

  React.useEffect(() => {
    const { current } = canvas;

    /**
     * Event handler
     * @param options Handler options
     */
    const handler = (options: E): void => {
      if (callback(options)) {
        force_update();
      }
    };

    if (current) {
      current.on<K, E>(event_name, handler);
    }

    return () => {
      if (current) {
        current.off<K>(event_name, handler);
      }
    };
  }, [callback, canvas, event_name]);
};
