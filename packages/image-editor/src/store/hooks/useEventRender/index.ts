import { CanvasEvents } from "fabric";
import React from "react";

import { useCanvas } from "../../../hooks";

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

  if (canvas.current) {
    canvas.current.on<K, E>(eventName, (options) => {
      if (callback(options)) {
        forceUpdate();
      }
    });
  }
};
