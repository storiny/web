/**
 * Adjusts X and Y coordinates with rotation
 * @param sides Sides
 * @param x X value
 * @param y Y value
 * @param angle Rotation angle
 * @param deltaX1 Delta X1
 * @param deltaY1 Delta Y1
 * @param deltaX2 Delta X2
 * @param deltaY2 Delta Y2
 */
export const adjustXYWithRotation = (
  sides: {
    e?: boolean;
    n?: boolean;
    s?: boolean;
    w?: boolean;
  },
  x: number,
  y: number,
  angle: number,
  deltaX1: number,
  deltaY1: number,
  deltaX2: number,
  deltaY2: number
): [number, number] => {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  if (sides.e && sides.w) {
    x += deltaX1 + deltaX2;
  } else if (sides.e) {
    x += deltaX1 * (1 + cos);
    y += deltaX1 * sin;
    x += deltaX2 * (1 - cos);
    y += deltaX2 * -sin;
  } else if (sides.w) {
    x += deltaX1 * (1 - cos);
    y += deltaX1 * -sin;
    x += deltaX2 * (1 + cos);
    y += deltaX2 * sin;
  }

  if (sides.n && sides.s) {
    y += deltaY1 + deltaY2;
  } else if (sides.n) {
    x += deltaY1 * sin;
    y += deltaY1 * (1 - cos);
    x += deltaY2 * -sin;
    y += deltaY2 * (1 + cos);
  } else if (sides.s) {
    x += deltaY1 * -sin;
    y += deltaY1 * (1 + cos);
    x += deltaY2 * sin;
    y += deltaY2 * (1 - cos);
  }

  return [x, y];
};
