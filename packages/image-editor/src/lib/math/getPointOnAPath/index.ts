import { Point } from "../../../types";

/**
 * Returns a point on the oath
 * @param point Point
 * @param path Path
 */
export const getPointOnAPath = (
  point: Point,
  path: Point[]
): { segment: number; x: number; y: number } | null => {
  const [px, py] = point;
  const [start, ...other] = path;
  let [lastX, lastY] = start;
  let kLine: number = 0;
  let idx: number = 0;

  // If any item in the array is true, it means that a point is
  // on some segment of a line-based path
  const retVal = other.some(([x2, y2], i) => {
    // We always take a line when dealing with line segments
    const x1 = lastX;
    const y1 = lastY;
    lastX = x2;
    lastY = y2;

    // If a point is not within the domain of the line segment,
    // it is not on the line segment
    if (px < x1 || px > x2) {
      return false;
    }

    // Check if all points lie on the same line
    // y1 = kx1 + b, y2 = kx2 + b
    // y2 - y1 = k(x2 - x2) -> k = (y2 - y1) / (x2 - x1)

    // Coefficient for the line (p0, p1)
    const kL = (y2 - y1) / (x2 - x1);
    // Coefficient for the line segment (p0, point)
    const kP1 = (py - y1) / (px - x1);
    // Coefficient for the line segment (point, p1)
    const kP2 = (py - y2) / (px - x2);

    // As we are basing both lines from the same starting point,
    // the only option for collinearity is having same coefficients

    // Using it for floating point comparisons
    const epsilon = 0.3;

    // If coefficient is more than an arbitrary epsilon,
    // these lines are not collinear
    if (Math.abs(kP1 - kL) > epsilon && Math.abs(kP2 - kL) > epsilon) {
      return false;
    }

    // Store the coefficient because we are goint to need it
    kLine = kL;
    idx = i;

    return true;
  });

  // Return a coordinate that is always on the line segment
  if (retVal) {
    return { x: point[0], y: kLine * point[0], segment: idx };
  }

  return null;
};
