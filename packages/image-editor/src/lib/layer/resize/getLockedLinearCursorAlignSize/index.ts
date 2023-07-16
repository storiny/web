import { SHIFT_LOCKING_ANGLE } from "../../../../constants/new";

/**
 * Returns the align size for lock linear cursor
 * @param originX Origin X coordinate
 * @param originY Origin Y coordinate
 * @param x X value
 * @param y Y value
 */
export const getLockedLinearCursorAlignSize = (
  originX: number,
  originY: number,
  x: number,
  y: number
): { height: number; width: number } => {
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
    // Locked angle line, y = mx + b => mx - y + b = 0
    const a1 = Math.tan(lockedAngle);
    const b1 = -1;
    const c1 = originY - a1 * originX;

    // Line through cursor, perpendicular to the locked angle line
    const a2 = -1 / a1;
    const b2 = -1;
    const c2 = y - a2 * x;

    // Intersection of the two lines above
    const intersectX = (b1 * c2 - b2 * c1) / (a1 * b2 - a2 * b1);
    const intersectY = (c1 * a2 - c2 * a1) / (a1 * b2 - a2 * b1);

    // Delta
    width = intersectX - originX;
    height = intersectY - originY;
  }

  return { width, height };
};
