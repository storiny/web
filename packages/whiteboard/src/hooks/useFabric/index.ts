import { Canvas } from "fabric";
import React from "react";

import { selectTheme } from "~/redux/features";
import { useAppSelector } from "~/redux/hooks";

import { FabricContext } from "../../components/Context";
import { CURSORS, SWATCH } from "../../constants";
import { Image } from "../../lib";
import { useWhiteboard } from "../useWhiteboard";
import { bindEvents } from "./events";
import {
  registerActions,
  registerClone,
  registerDraw,
  registerGuides,
  registerHistory,
  registerKeyboard,
  registerPan,
  registerTooltip
} from "./plugins";

/**
 * Hook for initializing fabric context
 */
export const useFabric = (): ((
  element: HTMLCanvasElement
) => Promise<boolean> | undefined) => {
  const { initialImageUrl } = useWhiteboard();
  const canvas = React.useContext(FabricContext);
  const theme = useAppSelector(selectTheme);
  return React.useCallback((element: HTMLCanvasElement) => {
    if (!element) {
      return canvas.current?.dispose();
    }

    canvas.current = new Canvas(element, {
      enableRetinaScaling: true,
      backgroundColor: theme === "dark" ? SWATCH.dark : SWATCH.light,
      selectionColor: "rgba(46,115,252,0.12)",
      selectionBorderColor: "rgba(106,172,255,0.8)",
      selectionLineWidth: 1.75,
      defaultCursor: CURSORS.default,
      hoverCursor: CURSORS.default,
      moveCursor: CURSORS.move,
      uniformScaling: false, // Uniformly scale X and Y
      preserveObjectStacking: true // Prevents bringing selected objects to the front
    });

    // Disable context menu
    const selectionElement = canvas.current.getSelectionElement();
    selectionElement.addEventListener("contextmenu", (event) => {
      event.preventDefault();
    });

    // Load the initial image into the canvas
    if (initialImageUrl) {
      Image.fromURL(initialImageUrl).then((loaded) => {
        if (canvas.current) {
          loaded.set({
            left: canvas.current.width / 2,
            top: canvas.current.height / 2
          });

          canvas.current.add(loaded);

          // Revoke to avoid memory leaks
          URL.revokeObjectURL(initialImageUrl);
        }
      });
    }

    [
      bindEvents,
      registerGuides,
      registerTooltip,
      registerKeyboard,
      registerClone,
      registerActions,
      registerPan,
      registerDraw,
      registerHistory
    ].forEach((bindable) => bindable(canvas.current));

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};
