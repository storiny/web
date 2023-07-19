import { PointerCoords } from "../../types";

/**
 * Returns the center point coordinates
 * @param pointers Pointers
 */
export const getCenter = (
  pointers: Map<number, PointerCoords>
): { x: number; y: number } => {
  const allCoords = Array.from(pointers.values());

  return {
    x: sum(allCoords, (coords) => coords.x) / allCoords.length,
    y: sum(allCoords, (coords) => coords.y) / allCoords.length
  };
};

/**
 * Returns distance
 * @param a Point
 * @param b Another point
 */
export const getDistance = ([a, b]: readonly PointerCoords[]): number =>
  Math.hypot(a.x - b.x, a.y - b.y);

/**
 * Sums an array
 * @param array Arrat
 * @param mapper Mapper
 */
const sum = <T>(array: readonly T[], mapper: (item: T) => number): number =>
  array.reduce((acc, item) => acc + mapper(item), 0);
