import { LayerType } from "../../../../constants";
import { SHIFT_LOCKING_ANGLE } from "../../../../constants/new";

/**
 * Makes a perfect shape or diagonal / horizontal / vertical line
 * @param layerType Layer type
 * @param width Width
 * @param height Height
 */
export const getPerfectLayerSize = (
  layerType: LayerType,
  width: number,
  height: number
): { height: number; width: number } => {
  const absWidth = Math.abs(width);
  const absHeight = Math.abs(height);

  if (
    layerType === LayerType.LINE ||
    layerType === LayerType.ARROW ||
    layerType === LayerType.FREE_DRAW
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
  } else if (layerType !== LayerType.SELECTION) {
    height = absWidth * Math.sign(height);
  }

  return { width, height };
};
