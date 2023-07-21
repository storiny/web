import { Canvas } from "fabric";
import React from "react";

import { FabricContext } from "../../components/Context";
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

    canvas.current.selectionColor = "rgba(46, 115, 252, 0.11)";
    canvas.current.selectionBorderColor = "rgba(98, 155, 255, 0.81)";
    canvas.current.selectionLineWidth = 1.5;

    bindEvents(canvas.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};
