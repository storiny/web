import { CanvasEvents } from "fabric";
import React from "react";

import { useCanvas } from "../index";

/**
 * Hooks for force re-rendering on canvas event
 * @param eventName Event name
 * @param callback Callback
 */
export const useEventRender = <
  K extends keyof CanvasEvents,
  E extends CanvasEvents[K]
>(
  eventName: K,
  callback: (options: E) => boolean
): void => {
  const canvas = useCanvas();
  const [, forceUpdate] = React.useReducer((x) => x + 1, 0);

  React.useEffect(() => {
    const { current } = canvas;

    /**
     * Event handler
     * @param options Handler options
     */
    const eventHandler = (options: E): void => {
      if (callback(options)) {
        forceUpdate();
      }
    };

    if (current) {
      current.on<K, E>(eventName, eventHandler);
    }

    return () => {
      if (current) {
        current.off<K>(eventName, eventHandler);
      }
    };
  }, [callback, canvas, eventName]);
};
