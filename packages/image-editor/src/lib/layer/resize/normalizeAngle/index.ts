/**
 * Normalizes an angle
 * @param angle Angle to normalize
 */
export const normalizeAngle = (angle: number): number => {
  if (angle < 0) {
    return angle + 2 * Math.PI;
  }

  if (angle >= 2 * Math.PI) {
    return angle - 2 * Math.PI;
  }

  return angle;
};
