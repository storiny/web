import { Canvas } from "fabric";
import React from "react";

import { FabricContext } from "../../components/Context";
import { CURSORS } from "../../constants";
import { bindEvents } from "./events";

/**
 * Hook for initializing fabric context
 */
export const useFabric = (): ((
  element: HTMLCanvasElement
) => Promise<boolean> | undefined) => {
  const canvas = React.useContext(FabricContext);
  return React.useCallback((element: HTMLCanvasElement) => {
    if (!element) {
      return canvas.current?.dispose();
    }

    canvas.current = new Canvas(element, {
      enableRetinaScaling: true
    });

    canvas.current.set({
      selectionColor: "rgba(46, 115, 252, 0.11)",
      selectionBorderColor: "rgba(98, 155, 255, 0.81)",
      selectionLineWidth: 1.5,
      defaultCursor: CURSORS.default,
      moveCursor: CURSORS.move,
      hoverCursor: CURSORS.move
    });

    bindEvents(canvas.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};
