/**
 * Returns the grid point
 * @param x X value
 * @param y Y value
 * @param gridSize Grid size value
 */
export const getGridPoint = (
  x: number,
  y: number,
  gridSize: number | null
): [number, number] => {
  if (gridSize) {
    // TODO: Rounding this point causes some shake when free drawing
    return [
      Math.round(x / gridSize) * gridSize,
      Math.round(y / gridSize) * gridSize
    ];
  }

  return [x, y];
};
