import { Canvas } from "fabric";
import React from "react";

import { select_resolved_theme } from "~/redux/features";
import { use_app_selector } from "~/redux/hooks";

import { FabricContext } from "../../components/context";
import { CURSORS, SWATCH } from "../../constants";
import { Image } from "../../lib";
import { use_whiteboard } from "../use-whiteboard";
import { bind_events } from "./events";
import {
  register_actions,
  register_clone,
  register_draw,
  register_guides,
  register_history,
  register_keyboard,
  register_pan,
  register_tooltip
} from "./plugins";

/**
 * Hook for initializing fabric context
 */
export const use_fabric = (): ((
  element: HTMLCanvasElement
) => Promise<boolean> | undefined) => {
  const { initial_image_url } = use_whiteboard();
  const canvas = React.useContext(FabricContext);
  const theme = use_app_selector(select_resolved_theme);

  return React.useCallback((element: HTMLCanvasElement) => {
    if (!element) {
      return canvas.current?.dispose();
    }

    canvas.current = new Canvas(element, {
      /* eslint-disable prefer-snakecase/prefer-snakecase */
      enableRetinaScaling: true,
      backgroundColor: SWATCH[theme],
      selectionColor: "rgba(46,115,252,0.12)",
      selectionBorderColor: "rgba(106,172,255,0.8)",
      selectionLineWidth: 1.75,
      defaultCursor: CURSORS.default,
      hoverCursor: CURSORS.default,
      moveCursor: CURSORS.move,
      uniformScaling: false, // Uniformly scale X and Y
      preserveObjectStacking: true // Prevents bringing selected objects to the front
      /* eslint-enable prefer-snakecase/prefer-snakecase */
    });

    // Disable context menu
    const selection_element = canvas.current.getSelectionElement();
    selection_element.addEventListener("contextmenu", (event) => {
      event.preventDefault();
    });

    // Load the initial image into the canvas
    if (initial_image_url) {
      Image.fromURL(initial_image_url).then((loaded) => {
        if (canvas.current) {
          loaded.set({
            left: canvas.current.width / 2,
            top: canvas.current.height / 2
          });

          canvas.current.add(loaded);

          // Revoke to avoid memory leaks
          URL.revokeObjectURL(initial_image_url);
        }
      });
    }

    [
      bind_events,
      register_guides,
      register_tooltip,
      register_keyboard,
      register_clone,
      register_actions,
      register_pan,
      register_draw,
      register_history
    ].forEach((bindable) => bindable(canvas.current));

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};
