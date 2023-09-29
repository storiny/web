const DEFAULT_PROPORTIONAL_RADIUS = 0.5;

/**
 * Returns scaled corner radius for a shape
 * @param min_size Shape minimum size
 * @param original_radius Original corner radius
 */
export const get_corner_radius = (
  min_size: number,
  original_radius: number
): number => {
  const cutoff_size = original_radius / DEFAULT_PROPORTIONAL_RADIUS;

  if (min_size <= cutoff_size) {
    return min_size * DEFAULT_PROPORTIONAL_RADIUS;
  }

  return original_radius;
};
