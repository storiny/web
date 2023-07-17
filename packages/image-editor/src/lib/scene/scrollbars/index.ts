import { getGlobalCSSVariable } from "../../../core/utils";
import { Layer, Zoom } from "../../../types";
import { getCommonBounds } from "../../layer";
import { ScrollBars } from "../types";

export const SCROLLBAR_MARGIN = 4;
export const SCROLLBAR_SIZE = 6;
export const SCROLLBAR_COLOR = "rgba(0,0,0,0.3)";

/**
 * Returns scrollbar positions
 * @param layers Layers
 * @param viewportWidth Viewport width
 * @param viewportHeight Viewport height
 * @param scrollX Scroll X value
 * @param scrollY Scroll Y value
 * @param zoom Zoom value
 */
export const getScrollBars = (
  layers: readonly Layer[],
  viewportWidth: number,
  viewportHeight: number,
  {
    scrollX,
    scrollY,
    zoom
  }: {
    scrollX: number;
    scrollY: number;
    zoom: Zoom;
  }
): ScrollBars => {
  if (layers.length === 0) {
    return {
      horizontal: null,
      vertical: null
    };
  }

  // This is the bounding box of all the layers
  const [layersMinX, layersMinY, layersMaxX, layersMaxY] =
    getCommonBounds(layers);

  // Apply zoom
  const viewportWidthWithZoom = viewportWidth / zoom.value;
  const viewportHeightWithZoom = viewportHeight / zoom.value;

  const viewportWidthDiff = viewportWidth - viewportWidthWithZoom;
  const viewportHeightDiff = viewportHeight - viewportHeightWithZoom;

  const safeArea = {
    top: parseInt(getGlobalCSSVariable("sat")) || 0,
    bottom: parseInt(getGlobalCSSVariable("sab")) || 0,
    left: parseInt(getGlobalCSSVariable("sal")) || 0,
    right: parseInt(getGlobalCSSVariable("sar")) || 0
  };

  // The viewport is the rectangle currently visible to the user
  const viewportMinX = -scrollX + viewportWidthDiff / 2 + safeArea.left;
  const viewportMinY = -scrollY + viewportHeightDiff / 2 + safeArea.top;
  const viewportMaxX = viewportMinX + viewportWidthWithZoom - safeArea.right;
  const viewportMaxY = viewportMinY + viewportHeightWithZoom - safeArea.bottom;

  // The scene is the bounding box of both the layers and viewport
  const sceneMinX = Math.min(layersMinX, viewportMinX);
  const sceneMinY = Math.min(layersMinY, viewportMinY);
  const sceneMaxX = Math.max(layersMaxX, viewportMaxX);
  const sceneMaxY = Math.max(layersMaxY, viewportMaxY);

  // The scrollbar represents where the viewport is in relationship to the scene
  return {
    horizontal:
      viewportMinX === sceneMinX && viewportMaxX === sceneMaxX
        ? null
        : {
            x:
              Math.max(safeArea.left, SCROLLBAR_MARGIN) +
              ((viewportMinX - sceneMinX) / (sceneMaxX - sceneMinX)) *
                viewportWidth,
            y:
              viewportHeight -
              SCROLLBAR_SIZE -
              Math.max(SCROLLBAR_MARGIN, safeArea.bottom),
            width:
              ((viewportMaxX - viewportMinX) / (sceneMaxX - sceneMinX)) *
                viewportWidth -
              Math.max(SCROLLBAR_MARGIN * 2, safeArea.left + safeArea.right),
            height: SCROLLBAR_SIZE
          },
    vertical:
      viewportMinY === sceneMinY && viewportMaxY === sceneMaxY
        ? null
        : {
            x:
              viewportWidth -
              SCROLLBAR_SIZE -
              Math.max(safeArea.right, SCROLLBAR_MARGIN),
            y:
              ((viewportMinY - sceneMinY) / (sceneMaxY - sceneMinY)) *
                viewportHeight +
              Math.max(safeArea.top, SCROLLBAR_MARGIN),
            width: SCROLLBAR_SIZE,
            height:
              ((viewportMaxY - viewportMinY) / (sceneMaxY - sceneMinY)) *
                viewportHeight -
              Math.max(SCROLLBAR_MARGIN * 2, safeArea.top + safeArea.bottom)
          }
  };
};

/**
 * Predicate function for determining whether the coordinates are over scrollbars
 * @param scrollBars Scroll bars
 * @param x X value
 * @param y Y value
 */
export const isOverScrollBars = (
  scrollBars: ScrollBars,
  x: number,
  y: number
): {
  isOverEither: boolean;
  isOverHorizontal: boolean;
  isOverVertical: boolean;
} => {
  const [isOverHorizontal, isOverVertical] = [
    scrollBars.horizontal,
    scrollBars.vertical
  ].map(
    (scrollBar) =>
      scrollBar != null &&
      scrollBar.x <= x &&
      x <= scrollBar.x + scrollBar.width &&
      scrollBar.y <= y &&
      y <= scrollBar.y + scrollBar.height
  );
  const isOverEither = isOverHorizontal || isOverVertical;

  return { isOverEither, isOverHorizontal, isOverVertical };
};
