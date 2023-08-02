import { BaseFabricObject } from "fabric";

import { Arrow, Line } from "../../lib";

/**
 * Predicate function for determining linear objects
 * @param object Object
 */
export const isLinearObject = (
  object: BaseFabricObject
): object is Line | Arrow => object instanceof Line || object instanceof Arrow;
