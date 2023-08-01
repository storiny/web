import { BaseFabricObject } from "fabric";

import { Line } from "../../lib";

/**
 * Predicate function for determining linear objects
 * @param object Object
 */
export const isLinearObject = (object: BaseFabricObject): object is Line =>
  object instanceof Line;
