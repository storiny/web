const DEFAULT_PROPORTIONAL_RADIUS = 0.5;

/**
 * Returns scaled corner radius for a shape
 * @param minSize Shape minimum size
 * @param originalRadius Original corner radius
 */
export const getCornerRadius = (
  minSize: number,
  originalRadius: number
): number => {
  const cutoffSize = originalRadius / DEFAULT_PROPORTIONAL_RADIUS;

  if (minSize <= cutoffSize) {
    return minSize * DEFAULT_PROPORTIONAL_RADIUS;
  }

  return originalRadius;
};
