import { SHIFT_LOCKING_ANGLE } from "../constants";
import { AppState } from "../types";
import { mutateLayer } from "./mutateLayer";
import { isFreeDrawLayer, isLinearLayer } from "./typeChecks";
import { ExcalidrawLayer } from "./types";

export const isInvisiblySmallLayer = (layer: ExcalidrawLayer): boolean => {
  if (isLinearLayer(layer) || isFreeDrawLayer(layer)) {
    return layer.points.length < 2;
  }
  return layer.width === 0 && layer.height === 0;
};

/**
 * Makes a perfect shape or diagonal/horizontal/vertical line
 */
export const getPerfectLayerSize = (
  layerType: AppState["activeTool"]["type"],
  width: number,
  height: number
): { height: number; width: number } => {
  const absWidth = Math.abs(width);
  const absHeight = Math.abs(height);

  if (
    layerType === "line" ||
    layerType === "arrow" ||
    layerType === "freedraw"
  ) {
    const lockedAngle =
      Math.round(Math.atan(absHeight / absWidth) / SHIFT_LOCKING_ANGLE) *
      SHIFT_LOCKING_ANGLE;
    if (lockedAngle === 0) {
      height = 0;
    } else if (lockedAngle === Math.PI / 2) {
      width = 0;
    } else {
      height = absWidth * Math.tan(lockedAngle) * Math.sign(height) || height;
    }
  } else if (layerType !== "selection") {
    height = absWidth * Math.sign(height);
  }
  return { width, height };
};

export const getLockedLinearCursorAlignSize = (
  originX: number,
  originY: number,
  x: number,
  y: number
) => {
  let width = x - originX;
  let height = y - originY;

  const lockedAngle =
    Math.round(Math.atan(height / width) / SHIFT_LOCKING_ANGLE) *
    SHIFT_LOCKING_ANGLE;

  if (lockedAngle === 0) {
    height = 0;
  } else if (lockedAngle === Math.PI / 2) {
    width = 0;
  } else {
    // locked angle line, y = mx + b => mx - y + b = 0
    const a1 = Math.tan(lockedAngle);
    const b1 = -1;
    const c1 = originY - a1 * originX;

    // line through cursor, perpendicular to locked angle line
    const a2 = -1 / a1;
    const b2 = -1;
    const c2 = y - a2 * x;

    // intersection of the two lines above
    const intersectX = (b1 * c2 - b2 * c1) / (a1 * b2 - a2 * b1);
    const intersectY = (c1 * a2 - c2 * a1) / (a1 * b2 - a2 * b1);

    // delta
    width = intersectX - originX;
    height = intersectY - originY;
  }

  return { width, height };
};

export const resizePerfectLineForNWHandler = (
  layer: ExcalidrawLayer,
  x: number,
  y: number
) => {
  const anchorX = layer.x + layer.width;
  const anchorY = layer.y + layer.height;
  const distanceToAnchorX = x - anchorX;
  const distanceToAnchorY = y - anchorY;
  if (Math.abs(distanceToAnchorX) < Math.abs(distanceToAnchorY) / 2) {
    mutateLayer(layer, {
      x: anchorX,
      width: 0,
      y,
      height: -distanceToAnchorY
    });
  } else if (Math.abs(distanceToAnchorY) < Math.abs(layer.width) / 2) {
    mutateLayer(layer, {
      y: anchorY,
      height: 0
    });
  } else {
    const nextHeight =
      Math.sign(distanceToAnchorY) * Math.sign(distanceToAnchorX) * layer.width;
    mutateLayer(layer, {
      x,
      y: anchorY - nextHeight,
      width: -distanceToAnchorX,
      height: nextHeight
    });
  }
};

export const getNormalizedDimensions = (
  layer: Pick<ExcalidrawLayer, "width" | "height" | "x" | "y">
): {
  height: ExcalidrawLayer["height"];
  width: ExcalidrawLayer["width"];
  x: ExcalidrawLayer["x"];
  y: ExcalidrawLayer["y"];
} => {
  const ret = {
    width: layer.width,
    height: layer.height,
    x: layer.x,
    y: layer.y
  };

  if (layer.width < 0) {
    const nextWidth = Math.abs(layer.width);
    ret.width = nextWidth;
    ret.x = layer.x - nextWidth;
  }

  if (layer.height < 0) {
    const nextHeight = Math.abs(layer.height);
    ret.height = nextHeight;
    ret.y = layer.y - nextHeight;
  }

  return ret;
};
