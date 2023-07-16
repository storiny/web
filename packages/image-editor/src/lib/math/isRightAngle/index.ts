/**
 * Predicate function for determining right angles
 * @param angle Angle
 */
export const isRightAngle = (angle: number): boolean =>
  Math.round((angle / Math.PI) * 10_000) % 5_000 === 0;
