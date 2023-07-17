import { Drawable, Op } from "roughjs/bin/core";

/**
 * Returns the curve path ops
 * @param shape Shape
 */
export const getCurvePathOps = (shape: Drawable): Op[] => {
  for (const set of shape.sets) {
    if (set.type === "path") {
      return set.ops;
    }
  }

  return shape.sets[0].ops;
};
