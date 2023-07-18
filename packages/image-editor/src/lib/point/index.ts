import { Point } from "../../types";

/**
 * Returns size from points
 * @param points Points
 */
export const getSizeFromPoints = (
  points: readonly Point[]
): { height: number; width: number } => {
  const xs = points.map((point) => point[0]);
  const ys = points.map((point) => point[1]);

  return {
    width: Math.max(...xs) - Math.min(...xs),
    height: Math.max(...ys) - Math.min(...ys)
  };
};

/**
 * Rescales points
 * @param dimension Dimension, 0 for rescaling only x and 1 for y
 * @param newSize New size
 * @param points Points
 * @param normalize Whether to normalize the points
 */
export const rescalePoints = (
  dimension: 0 | 1,
  newSize: number,
  points: readonly Point[],
  normalize: boolean
): Point[] => {
  const coordinates = points.map((point) => point[dimension]);
  const maxCoordinate = Math.max(...coordinates);
  const minCoordinate = Math.min(...coordinates);
  const size = maxCoordinate - minCoordinate;
  const scale = size === 0 ? 1 : newSize / size;
  let nextMinCoordinate = Infinity;
  const scaledPoints = points.map((point): Point => {
    const newCoordinate = point[dimension] * scale;
    const newPoint = [...point];
    newPoint[dimension] = newCoordinate;

    if (newCoordinate < nextMinCoordinate) {
      nextMinCoordinate = newCoordinate;
    }

    return newPoint as unknown as Point;
  });

  if (!normalize) {
    return scaledPoints;
  }

  if (scaledPoints.length === 2) {
    // We don't translate two-point lines
    return scaledPoints;
  }

  const translation = minCoordinate - nextMinCoordinate;

  return scaledPoints.map(
    (scaledPoint) =>
      scaledPoint.map((value, currentDimension) =>
        currentDimension === dimension ? value + translation : value
      ) as [number, number]
  );
};
