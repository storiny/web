import { Canvas } from "fabric";
import React from "react";

import { FabricContext } from "../../components/Context";
import { CURSORS } from "../../constants";
import { PenBrush } from "../../lib/shapes/Pen";
import { bindEvents } from "./events";
import {
  registerActions,
  registerClone,
  registerDraw,
  registerGuides,
  registerHistory,
  registerKeyboard,
  registerTooltip
} from "./plugins";

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
      enableRetinaScaling: true,
      selectionColor: "rgba(46,115,252,0.12)",
      selectionBorderColor: "rgba(106,172,255,0.8)",
      selectionLineWidth: 1.75,
      defaultCursor: CURSORS.default,
      hoverCursor: CURSORS.default,
      moveCursor: CURSORS.move,
      uniformScaling: false
    });

    // Disable context menu
    const selectionElement = canvas.current.getSelectionElement();
    selectionElement.addEventListener("contextmenu", (event) => {
      event.preventDefault();
    });

    canvas.current.isDrawingMode = true;
    canvas.current.freeDrawingBrush = new PenBrush(canvas.current);
    canvas.current.freeDrawingBrush.color = "#000";

    [
      bindEvents,
      registerGuides,
      registerTooltip,
      registerKeyboard,
      registerClone,
      registerActions,
      registerHistory,
      registerDraw
    ].forEach((bindable) => bindable(canvas.current));

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};
