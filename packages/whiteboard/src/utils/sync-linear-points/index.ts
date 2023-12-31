import { FabricObject, util } from "fabric";

import { is_linear_object } from "../is-linear-object";

/**
 * Syncs the point coordinates of a linear object
 * @param object Linear object
 */
export const sync_linear_points = (object: FabricObject): void => {
  if (is_linear_object(object)) {
    const points = object.calcLinePoints();
    const matrix = object.calcTransformMatrix();
    const { x: x1, y: y1 } = util.transformPoint(
      { x: points.x1, y: points.y1 },
      matrix
    );
    const { x: x2, y: y2 } = util.transformPoint(
      { x: points.x2, y: points.y2 },
      matrix
    );

    object.set({
      x1,
      y1,
      x2,
      y2,
      dirty: true
    });
  }
};
