import { BaseFabricObject } from "fabric";

import { Arrow } from "../../lib";

/**
 * Predicate function for determining arrow objects
 * @param object Object
 */
export const isArrowObject = (object: BaseFabricObject): object is Arrow =>
  object instanceof Arrow;
